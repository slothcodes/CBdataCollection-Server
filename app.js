const update = require('./getData.js').updateRankings
const getTags = require('./getData.js').getTopTags
const getTagResults = require('./getData.js').getTagResults
const express = require('express');
const { getTopTags } = require('./getData.js');

const app = express();

const PORT = '3000';

// [ ] Add Interval Timer To Update The Data
setInterval(update,3600000)

// [ ] Add Params To Request To Return The Appropriate Results For AllTags And EachTag As JSON
app.get('/all-tags',(req,res)=>{
    const topTags = getTopTags();
    res.json(topTags)
})
app.get('/:tag',(req,res)=>{
    // update()
    let entry = getTagResults(req.params.tag);
    if(entry !=undefined){
       res.json(entry.results); 
    } else{
        res.send('not found')
    }
    
    
});

app.listen(PORT,()=>{
    console.log('Server Listening For Connections')
})