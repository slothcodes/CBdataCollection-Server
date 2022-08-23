const { count } = require('console');
const fs = require('fs');
const jsdom = require("jsdom");
const { stringify } = require('querystring');
const { JSDOM } = jsdom;

// TODO
// [X] HAVE NEW FUNCTION FETCH TAG LIST PAGE
// [X] GET TOP X NUMBER OF PAGES OF TAGS
// [X] GET VIEWERS AND ROOMS FOR EACH TAG
// [X] ADD TO JSON LIST
// [X] GET STREAM NAME AND VIEWERCOUNT
// [X] TEST API RESULT COUNT AGAINST WEB RESULTS IF API IS > SWITCH TO THAT
// [X] FETCH X PAGES FOR Each TAG
// [X] Reduce To First Page Of Tags
// [X] Create JSON Data Structure
// [X] Save The JSON File
// [X] Load The JSON File
// [X] Calculate Changes For Each Stream In Each Tag
    // [X] Load Previous Data
    // [X] Get Updated Data
    // [X] Calc Trending Tags
        // [X] For Each tag in updatedStats compare with previous stats
            // [X] Calc RawViewer Change And Percent Change
            // [X] Sort High To Low For Both Percent And Rawviewer Change
            // [X] If Not In Previous List Skip
            
            // [ ] For Each model in each Tag in updatedStats compare with previous stats 
                // [ ] Calc RawViewer Change And Percent Change
                // [ ] Sort High To Low For Both Percent And Rawviewer Change
                // [ ] If Not In Previous List Skip
    // [ ] Save Updated Rankings And updatedStats To Compare With Next Cycle
// [ ] Setup JSON server

async function awaitGetAllTags(){
    const pageNumArr = [1]
    let tagList = [];
    for (const page of pageNumArr){
        let url = 'https://chaturbate.com/tags/?sort=-rc&page='+page;
        let allTags = await getPageTags(url)
        tagList = tagList.concat(allTags)
    }
    return tagList
}

async function getPageTags(url){
    let pageList = []
    let rawPage = await fetch(url)
    let pageHTML = await rawPage.text()
    let parser = new JSDOM(pageHTML)
    let tagRows = parser.window.document.querySelectorAll('.tag_row')
    tagRows.forEach(row=>{
        let tagName = row.querySelector('.tag a').textContent
        let tagViewers = row.querySelector('.viewers').textContent
        let tagRooms = row.querySelector('.rooms').textContent
        pageList.push({
            'tag' : tagName.substring(1),
            'viewers' : parseInt(tagViewers),
            'rooms' : parseInt(tagRooms)

        })
    })
    return pageList
}

async function getAllTags(){
    const pageNumArr = [1] //,2,3,4,5]
    let tagList = [];
    pageNumArr.forEach(pageNum=>{
        let url = 'https://chaturbate.com/tags/?sort=-rc&page='+pageNum;
        
        let allTags = fetch(url)
        .then(result =>{
            return result.text()
        })
        .then(text =>{
            let parser = new JSDOM(text)
            let tagRows = parser.window.document.querySelectorAll('.tag_row')
            return tagRows
        })
        .then(rows =>{
            rows.forEach(row=>{
                let tagName = row.querySelector('.tag a').textContent
                let tagViewers = row.querySelector('.viewers').textContent
                let tagRooms = row.querySelector('.rooms').textContent
                tagList.push({
                    'tag' : tagName.substring(1),
                    'viewers' : parseInt(tagViewers),
                    'rooms' : parseInt(tagRooms)

                })
            })            
        })  
    })
    return tagList  
}

async function getAllModels(){
    let allTags = await awaitGetAllTags()
    let modelList = []
    let count = 0;
    for(const tag of allTags){
        count += 1
        console.log(count,'/',allTags.length)
        results = await getStreamTagListing(tag.tag)
        modelList = modelList.concat(results)
    }
    return modelList
}

async function getAPIresults(tag){
        console.log('fetching',tag)
        try{
            let url = "https://chaturbate.com/api/public/affiliates/onlinerooms/?wm=40M6h&format=json&client_ip=request_ip&limit=500&tag=" + tag;
            let tagResults = await (await fetch(url)).json()
            let returnArr = new Array; 
            // add error catch to see why its crashing here
            // console.log(tagResults)
            tagResults.results.forEach(entry=>{
                returnArr.push({
                    'name': entry.username,
                    'viewers': entry.num_users,
                    'description': entry.room_subject,
                    'tags': entry.tags
                })
            })
            // console.log('tagr',returnArr)
            return returnArr
        } catch {
            console.log('error')
        }
       
    
    // console.log(returnArr)
}

async function apiSlow(tag){
    // console.log('t',tag)
    const waitFor = delay => new Promise(resolve => setTimeout(resolve, delay));
    await waitFor(1200);
    results = await getAPIresults(tag) 
    // console.log('r',results)
    return results
}

async function apiTestLoop(){
    let allTags = await awaitGetAllTags()
    // console.log('alltags',allTags)
    // let allTags = [{'tag':'asian'},{'tag':'teen'}];
    let modelList = []
    // console.log(allTags)
    let count = 0;
    for(const tag of allTags){
        // add delay to stay within API limits
        const waitFor = delay => new Promise(resolve => setTimeout(resolve, delay));
        await waitFor(1200);
        results = await getAPIresults(tag.tag) 
        // console.log('test result',results)
        count += 1
        console.log(count,'/',allTags.length)
        modelList.push({
            'tag': tag.tag,
            'results': results
        })
        // modelList = modelList.concat(results)
        
        
    }
    return modelList
}

// getAPIresults('asian')

function saveJSON(filename,jsobOBJ){
    console.log(filename)
    // console.log(jsobOBJ)
    fs.writeFile(filename,JSON.stringify(jsobOBJ), (err) => {
        if (err)
          console.log(err);
        else {
          console.log("File written successfully\n");
        //   console.log("The written has the following contents:");
        //   console.log(fs.readFileSync("books.txt", "utf8"));
        }
    })
}

function loadJSON(filename){
    let rawdata = fs.readFileSync(filename);
    let streams = JSON.parse(rawdata);
    // console.log(streams)
    return streams
}

function calcRawViewerChange(oldInfo,newInfo){
    // console.log(oldInfo)
    let oldViewers = oldInfo.viewers;
    let newViewers = newInfo.viewers;
    let rawChange = newViewers - oldViewers
    return rawChange
}

function calcPerViewerChange(oldInfo,rawChange){
    // console.log(oldInfo)
    // console.log(rawChange)
    let oldViewers = oldInfo.viewers;
    let perChange = Math.floor((rawChange / oldViewers)*100);
    return perChange
}

function getTopRawViewerChanges(tagArray,numResults=20){
    // [ ] Sort Tag Results   
    // console.log(tagArray)
    tagArray.sort((a,b)=>{
        return b.viewRawChange - a.viewRawChange
    })
  return tagArray.slice(0,numResults)
}

function getTopPerViewerChanges(tagArray,numResults=20){
    // [ ] Sort Tag Results   
    // console.log(tagArray)
    tagArray.sort((a,b)=>{
        return b.viewPerChange - a.viewPerChange
    })
  return tagArray.slice(0,numResults)
}

function calcTagChanges(oldTagData,newTagData){
    let returnTags = new Array;
    // [ ] For Each tag in updatedStats compare with previous stats
    newTagData.forEach(tag=>{
        // console.log(' ')
        let oldInfo = oldTagData.find(entry => entry.tag === tag.tag);
        if(oldInfo != undefined){
            // console.log('old',oldInfo);
            // console.log('new',tag);
            // [ ] Calc RawViewer Change And Percent Change
            let viewRawChange = calcRawViewerChange(oldInfo,tag);
            let viewPerChange = calcPerViewerChange(oldInfo,viewRawChange);
            returnTags.push({
                'tag' : tag.tag,
                'viewRawChange': viewRawChange,
                'viewPerChange': viewPerChange
            })

        }
        
    })
    return returnTags
}

function calcTopStreams(oldStreamInfo,newStreamInfo){
    // [ ] ForOF loop for tags use ApiSlow to get stream list (may need this function to be async)
    let returns = new Array;
    newStreamInfo.forEach(entry =>{
        // console.log('tag',entry.tag)
        
        // console.log(oldStreamInfo)
        let oldTagInfo = oldStreamInfo.find(oldEntry => oldEntry.tag === entry.tag) 
        let subReturn = [];
        if (oldTagInfo != undefined){
            entry.results.forEach(alpha =>{
                // console.log(alpha)
                let currentName = alpha.name;
                let oldName = oldTagInfo.results.find(beta => beta.name === currentName)
                if (oldName != undefined){
                    // console.log('currName',currentName)
                    // console.log('oldName',oldName.name)
                    let rawChange = calcRawViewerChange(oldName,alpha)
                    let changePer = calcPerViewerChange(oldName,rawChange)
                    // console.log(changePer)
                    subReturn.push({
                        'name':currentName,
                        'change': rawChange
                    })
                    //get viewers and pass into calc functions
                    // add to list of stream objects
                    // create obj for tag and stream obj list
                    // return main list
                    // pass into new function to sort each tag and take top X streams
                }
                
            })
            // console.log(Object.getOwnPropertyNames(oldTagInfo))
            returns.push({
                'tag':entry.tag,
                'results': subReturn
            })
        } 
    })
    saveJSON('calcDiffernces.json',returns)
    // console.log(returns[1])
    return returns
}

async function getStreamsData(newTags){
    // [ ] ForOF loop for tags use ApiSlow to get stream list (may need this function to be async)
    let returns = new Array;
    for (tag of newTags){
        let testR = await apiSlow(tag.tag);
        returns.push({
            'tag': tag.tag,
            'results': testR
        })
    }  
    return returns 
}

function getSortedTop(allJSON){
    let sorted = new Array;
    allJSON.forEach(entry=>{
        entry.results.sort((a,b)=>{
            return b.change - a.change
        })
        sorted.push({
            'tag':entry.tag,
            'results': entry.results.slice(0,20)
        }) 
    })
    return sorted.slice(0,20)
    
}

// [ ] Calculate Changes For Each Stream In Each Tag
async function updateRankings(){
    try{
        // [ ] Load Previous Data 
        let prevTagData = loadJSON('sortedTags.json');
        let prevStreamData = loadJSON('previousCycle.json');
        // [ ] Get Updated Tag Data
        var tagRanking = await awaitGetAllTags();
        // [ ] Call New Function To Get Top And Top Growing Tags
        let updated = calcTagChanges(prevTagData,tagRanking);
        // [ ] Get Top 20 Growing Tags
        let tagTopRawViewerResults = getTopRawViewerChanges(updated)
        // [ ] Get Top 20 Growing Tags For Percents
        let tagTopPerViewerResults = getTopPerViewerChanges(updated)
        // GET NEW STREAM DATA
        var streamDataArr = await getStreamsData(tagRanking)//tagRanking)
        // Calc Trending Streams For Trending Tags
        var streamCalcs = calcTopStreams(prevStreamData,streamDataArr);
        // Sort And Take Top X Results For Each Tag 
        var sortedTop = getSortedTop(streamCalcs)
        // Save Updated List Of All
        saveJSON('topStreams.json',sortedTop);
        saveJSON('streamCalc.json',streamCalcs);
        saveJSON('previousCycle.json',streamDataArr);
        saveJSON('sortedTags.json',tagRanking);
        return sortedTop
        
    }catch (error){
        console.log(error);
        saveJSON('topStreams.json',sortedTop);
        saveJSON('streamCalc.json',streamCalcs);
        saveJSON('previousCycle.json',streamDataArr)
        saveJSON('sortedTags.json',tagRanking)
    }

    // Return Final List

}

// Get Top Tags
function getTopTags(){
    let tagArr = loadJSON('sortedTags.json');
    return tagArr.slice(0,19)
}

// Search For Tag Results
function getTagResults(tag){
    let db = loadJSON('topStreams.json');
    let result = db.find(entry => entry.tag === tag) 
    return result
}


// loadJSON()
// let topTags = getTopTags();
// let tagResults = getTagResults('asian')
// console.log(tagResults)
// tagResults.results.forEach(entry=> console.log(entry))
// let testData = updateRankings()
module.exports = {updateRankings, getTagResults,getTopTags}