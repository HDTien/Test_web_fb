require('dotenv').config();
const compression = require('compression');
const express   = require('express');
const morgan = require('morgan');
const { default: helmet } = require('helmet')
  const app = express()

// console.log(`Process::`, process.env.key)
//init middleware
  app.use(morgan("dev"))
  app.use(helmet())
app.use(compression())
//  app.use(morgan("combined"))
//  app.use(morgan("common"))
//   app.use(morgan("short"))
//   app.use(morgan("tiny"))

//init db
require('./dbs/init.mongodb')
// const { checkOverload} =require ('./helpers/check.connect')
// checkOverload()

//init routes

// app.get('/hello', ( req, res, next) => {
//     const  strCompress ='hello world'
//     return res.status(200).json({
//          message :'Welcome Fantipjs',   
//         //  metadata : strCompress.repeat(100000)
//     })
// })
app.use('/', require('./routess'))
// app.get('/hello/tien', ( req, res, next) => {
//   const  strCompress ='hello world'
//   return res.status(200).json({
//        message :'ABC',   
//       //  metadata : strCompress.repeat(100000)
//   })
// })

//handling errors
module.exports = app
