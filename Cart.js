const mongoose = require('mongoose');

const cartSchema = new mongoose.Schema({

    products:[
        {  
            product:{                
            type : mongoose.Schema.ObjectId,
            ref : 'Product'
            },
            quantity:{
                type:Number,
                default:1
            }
        }
    ],
    total:{
        type:Number
    }
})
const Cart = mongoose.model('Cart',cartSchema);
module.exports={Cart};
