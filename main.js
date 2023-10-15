require('dotenv').config()

const express = require('express')
const app = express()
app.use(express.json())
const axios = require('axios').default;

const mongoose = require('mongoose')
const cheerio = require("cheerio");
const pretty = require("pretty");

const Product = require('./models/productModels')

mongoose.connect(process.env.CONNECTION_STRING)
.then(() => {
    console.log('connected to MongoDB')
    app.listen(3000, () => console.log('Server started'))
    console.log("Hello") 
}).catch((error) => {
    console.log(error)
})

app.post('/processText',async(req,res) => {
    const products = await Product.create(req.body) 
    res.status(200).json(products)
})

async function query(data) {
	const response = await fetch(
		"https://api-inference.huggingface.co/models/yanekyuk/bert-keyword-extractor",
		{
			headers: { Authorization: "Bearer " + process.env.API_KEY},
			method: "POST",
			body: JSON.stringify(data),
		}
	);
	const result = await response.json();
	return result;
}

async function addData(data) {
    try {
      const response = await axios.post(`http://localhost:3000/processText`, data);
      console.log(response);
    } catch (error) {
      console.error(error);
    }
  }

const name = "test name"
const url = "www.tutorialspoint.com/java"
//const text = "C++ is a general-purpose programming language that was developed as an enhancement of the C language to include object-oriented paradigm. It is an imperative and a compiled language. C++ is a high-level, general-purpose programming language designed for system and application programming. It was developed by Bjarne Stroustrup at Bell Labs in 1983 as an extension of the C programming language. C++ is an object-oriented, multi-paradigm language that supports procedural, functional, and generic programming styles. One of the key features of C++ is its ability to support low-level, system-level programming, making it suitable for developing operating systems, device drivers, and other system software. At the same time, C++ also provides a rich set of libraries and features for high-level application programming, making it a popular choice for developing desktop applications, video games, and other complex applications. C++ has a large, active community of developers and users, and a wealth of resources and tools available for learning and using the language. Some of the key features of C++ include: Object-Oriented Programming: C++ supports object-oriented programming, allowing developers to create classes and objects and to define methods and properties for these objects. Templates: C++ templates allow developers to write generic code that can work with any data type, making it easier to write reusable and flexible code. Standard Template Library (STL): The STL provides a wide range of containers and algorithms for working with data, making it easier to write efficient and effective code. Exception Handling: C++ provides robust exception handling capabilities, making it easier to write code that can handle errors and unexpected situations."

var text;
axios
.get("https://" + url)
  .then(function (response) {
    const $ = cheerio.load(response.data);
    const textHTML = $('p')
    // console.log(pretty(textHTML.html()));
    text = textHTML.html();
   

var temp = query(text)
var tagList = new Map();
temp.then(async (result) => {
    var keyList = [];
    for(var i=0;i<result.length;i++){
        if(tagList.has(result[i]["word"])){
            tagList.set(result[i]["word"],tagList.get(result[i]["word"]) + result[i]["score"])
        } else {
            tagList.set(result[i]["word"],result[i]["score"])
        }
        
        keyList.push(result[i]["word"])
    }
    tagList = Array.from(tagList, ([name, value]) => ({ name, value }))
    tagList = JSON.stringify(tagList).split('"name":').join('"tag":')
    tagList = tagList.split('"value":').join('"weight":')
    tagList = JSON.parse(tagList)
    const finalJson = {}
    finalJson["name"] = name
    finalJson["url"] = url
    finalJson["tags"] = tagList
    console.log(finalJson)
    const products = await Product.create(finalJson) 
    addData(products)

});

})
