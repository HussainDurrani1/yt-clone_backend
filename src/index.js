import 'dotenv/config';
// import dotenv from 'dotenv';
// dotenv.config({path: './env'});

import connectDB from './db/index.js'

const port = process.env.PORT;

connectDB()
    .then(() => {
        app.listen(port || 8000, () => {
            console.log(`\n✅ Server listening on PORT: ${port}...`);
        })
        app.on('error', (err) => {
            console.log('DataBase error: ', err);
            throw err;
        })
    })
    .catch((err) => {
        console.log('Mongo DB connection failed !!! ', err);
    })
























/*

import express from 'express'
const app = express();

(async ()=>{
try {
    console.log(`Complete MongoDB URI: '${process.env.MONGODB_URI}/${DB_NAME}'.`);
    await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)

    console.log('MongoDB connected successfully...');

    app.on('error', (err)=>{
        console.log('DataBase error: ', err);
        throw err;
    })
    app.listen(process.env.PORT, () => {
        console.log(`App is listening on PORT: ${process.env.PORT}`);
    })
} catch (err) {
    console.log('MongoDB connection error: ', err);
    console.log('warr gya code..');
    // throw err;
}
})();

*/