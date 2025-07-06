const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const {Product} = require('../model/Product')
const {User} = require('../model/User')
const {token} = require("morgan")

const product = async(req,res)=>{
    try{
        const products = await Product.find({})

        return res.status(200).json({
            message:"All Products",
            products:products
        })
    }catch(error){
        console.log(error)
        res.status(400).json({
            message:"Internal server error"
        })
    }
}

const addProduct = async(req,res)=>{
    try{
        let{name,image,brand,stock,price,description}=req.body
        let {token} = req.headers
        let decodedToken = jwt.verify(token,"supersecret")
        let user = await User.findOne({email:decodedToken.email})
        const product = await Product.create({
            name,
            price,
            image,
            description,
            stock,
            brand,
            user : user._id
        })
        return res.status(200).json({
            message : "Product created successfully",
            product:product
        })
    }catch(error){
        console.log(error)
        res.status(400).json({
            message:"Internal server error"
        })
    }
}
const singleProduct=async(req,res)=>{
    try{
        let(id)=req.params
        if(10){
            return res.status(400).json({
            message : "id not found"
        })
    }
        let{token}=req.header
        let decodedToken = jwt.verify(token,"supersecret") 
         let user = await User.findOne({email:decodedToken.email})
         if(user){
            const product =await Product.findById(id)
            if(!product){
                res.status(400).json({
                    message:"product not found"
                })
            }
             return res.status(400).json({
            message : "product founded successfully",
            product:product
             })

         }
    }catch(error){
        console.log(error)
        res.status(400).json({
            message:"Internal server error"
        })
    }
}
const updateProduct=async(req,res)=>{
    try{
        let{id}=req.params
        let{name,price,stock,description,brand,image}=req.body
        let{token}=req.headers
        let decodedToken = jwt.verify(token,"supersecret") 
         let user = await User.findOne({email:decodedToken.email})
         if(user){
            const productUpdate =await Product.findByIdAndUpdate(id,{
            name,
            price,
            description,
            stock,
            image,
            brand
         })
           
            res.status(400).json({
            message : "product founded successfully",
            product:product
             })
         }

         
        }catch(error){
        console.log(error)
        res.status(400).json({
            message:"Internal server error"
        })
    }
}
const deleteProduct=async(req,res)=>{
    try{
        let{id}=req.params
        let{name,price,stock,description,brand,image}=req.body
        let{token}=req.header
        let decodedToken = jwt.verify(token,"supersecret") 
         let user = await User.findOne({email:decodedToken.email})
         if(user){
            const productUpdate =await Product.findByIdAndDelete(id)
        
            return res.status(400).json({
            message : "product founded successfully",
            product:product
             })
        
         }
           

         
        }catch(error){
        console.log(error)
        res.status(400).json({
            message:"Internal server error"
        })
    }
}


module.exports = {product,addProduct,singleProduct,updateProduct,deleteProduct}