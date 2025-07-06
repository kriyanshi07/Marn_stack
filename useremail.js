const nodemailer=require("nodemailer")
const { product } = require("../controlles/product.controller")
const sendemail=async(userEmaild,ProductArray)=>{
      const transpoter=nodemailer.createTransport({
        service:"email",
        auth:{
            user:process.env.NODE_EMAIL,
            pass:process.env.NODE_PASSWORD
        }
           
      })
      const productDatalis=ProductArray.map(product,item=>{
        `$(index+1).Name:${product.name}.price:${product.price}`
      })

      //setup mail cpontent
      const mailoptions={
        from:process.env.NODE_EMAIL,
        to:userEmaild,
        subject:"your order details",
        text:"thanks for your purchase"
      }
      try{
        await transpoter.sendMail(mailoptions)
      }catch(e){
        console.log(e)
      }
}

module.exports=sendemail