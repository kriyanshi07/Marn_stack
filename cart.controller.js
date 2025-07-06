const { Cart } = require("../model/Cart");
const { User } = require("../model/User");
const { Product } = require("../model/Product");
const sendemail=require("../utils/useremail")
const stripe = require("stripe")(
  "sk_test_51ReqQm4It3RtdI9claLzNPpz3RxFFNsZT7eLOmmNFIcjmOz6SKZZVx8SkWmZpmLd5sD6VtBsWuWdqDxOs8LgP1aI00EjnJBcQ6"
);
const jwt = require("jsonwebtoken");
//const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const cart = async (req, res) => {
  try {
    const { token } = req.headers;
    const decodedToken = jwt.verify(token, "supersecret");
    const user = await User.findOne({ email: decodedToken.email }).populate({
      path: "cart",
      populate: {
        path: "products",
        model: "Product",
      },
    });
    if (!user) {
      res.status(400).json({
        message: "user not found",
      });
    }
    res.status(200).json({
      cart: user.cart,
      message: "cart retrived successfuly",
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      messsage: "internal server error",
    });
  }
};

const addCart = async (req, res) => {
  try {
    let { productID, quantity } = req.body;
    console.log(req.body)
    let { token } = req.headers;
    let decodedToken = jwt.verify(token, "supersecret");
    let user = await User.findOne({ email: decodedToken.email }).populate(
      "cart"
    );

    if (!productID || !quantity) {
      res.status(400).json({
        messsage: "some fields are missing",
      });
    }

    if (user) {
      const product = await Product.findById(productID);
      console.log(user);
      if (user.cart) {
        const cart = await Cart.findOne({ _id: user.cart._id });
        console.log(cart);
        const exists = cart.products.some(
          (p) => p.product.toString() === productID.toString()
        );
        if (exists) {
          return res.status(409).json({
            message: "go to Cart",
          });
        }
        cart.products.push({ product: productID, quantity: quantity });
        cart.total += product.price * quantity;
        await cart.save();
      } else {
        const newCart = await Cart.create({
          products: [
            {
              product: productID,
              quantity: quantity,
            },
          ],
          total: product.price * quantity,
        });
        user.cart = newCart._id;
        await user.save();
      }
    }

    return res.status(200).json({
      message: "product added to cart",
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      messsage: "internal server error",
    });
  }
};

const addProductToCart = async (req, res) => {
  try {
    const userId = req.user.userId;
    const productId = req.params.id;

    // Check if product exists
    const product = await Product.findById(productId);
    console.log(product);

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Check if user has a cart
    let cart = await Cart.findOne({ user: userId });

    if (!cart) {
      // If cart doesn't exist, create a new cart with quantity and price of the product 
      cart = new Cart({
        user: userId,
        products: [
          {
            productId: productId,  // use productId here!
            quantity: 1,
            price: product.price
          }
        ],
      });
    } else {
      // If cart exists, check if product already in cart so update quantity with price
      const existingProduct = cart.products.find(
        (item) => item.productId && item.productId.toString() === productId
      );

      if (existingProduct) {
        existingProduct.quantity += 1;
        existingProduct.price = product.price;
      } else {
        cart.products.push({ productId: productId, quantity: 1, price: product.price });
      }
    }

    // Calculate total price
    cart.total = cart.products.reduce((acc, item) => {
      return acc + item.price * item.quantity;
    }, 0);

    await cart.save();

    res.status(200).json({ message: 'Product added to cart successfully', cart });
  } catch (error) {
    console.error('Error adding product to cart:', error);
    res.status(500).json({ message: 'Error adding product to cart' });
  }
};

const updateCart = async (req, res) => {
  try {
    const { productID, action } = req.body;
    console.log(req.body)
    const token = req.headers.token;
    if (!token) {
      return res.status(401).json({ message: 'Unauthorized: No token provided' });
    }
    let decodedToken = jwt.verify(token, "supersecret");
    const user = await User.findOne({ email:decodedToken.email }).populate({
      path: "cart",
      populate: {
        path: "products.product",
        model: "Product",
      },
    });
    if (!user || !user.cart) {
      return res.status(400).json({
        message: "cart not found",
      });
    }
    const cart = user.cart;
    const item = cart.products.find(
      (p) => p.product._id.toString() === productID
    );
    if (!item) {
      return res.status(400).json({ message: "product not found" });
    }
    const totalPrice = item.product.price;
    //action logic
    if (action === "increase") {
      item.quantity += 1;
      cart.total += totalPrice;
    } else if (action === "decrease") {
      if (item.quantity > 1) {
        item.quantity -= 1;
        cart.total -= totalPrice;
      } else {
        cart.total -= totalPrice;
        cart.products = cart.products.filter(
          (p) => p.product._id.toString() !== productID
        );
      }
    } else if (action === "remove") {
      cart.total -= totalPrice = item.quantity;
      cart.products = cart.products.filter(
        (p) => p.product._id.toString() !== productID
      );
    } else {
      res.status(400).json({ message: "invalid action" });
    }
    await cart.save();
    return res.status(200).json({
      message: "cart updated",
      cart,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      messsage: "internal server error",
    });
  }
};

const payment = async (req, res) => {
  try {
    const { token } = req.headers;
    console.log(req.headers)
    const decodedToken = jwt.verify(token, "supersecret");
    const user = await User.findOne({ email: decodedToken.email }).populate({
      path: "cart",
      populate: {
        path: "products.product",
        model: "Product",
      },
    });
    if (!user || !user.cart || user.cart.products.length === 0) {
      res.status(404).json({ message: "user or cart not found" });
    }
    //payment
    const lineItem = user.cart.products.map((item) => {
      return {
        price_data: {
          currency: "inr",
          product_data: {
            name: item.product.name,
          },
          unit_amount: item.product.price * 100,
        },
        quantity: item.quantity,
      };
    });

    const currentUrl = process.env.CLIENT_URL;
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: lineItem,
      mode: "payment",
      success_url: `${currentUrl}/sucess`,
      cancel_url: `${currentUrl}/cancel`,
    });

    /*payment 2
    
const payment = async (req, res) => {
  try {
    console.log("Request Body:", req.body);

    const { products } = req.body;

    // Validate input
    if (!products || !Array.isArray(products) || products.length === 0) {
      return res.status(400).json({ message: "Invalid or missing products" });
    }

    // Create line items for Stripe
    const lineItems = products.map((item) => {
      if (!item.name || !item.price || !item.quantity) {
        throw new Error("Missing product data (name, price, quantity)");
      }

      return {
        price_data: {
          currency: "inr",
          product_data: {
            name: item.name,
          },
          unit_amount: item.price * 100, // Stripe uses paisa
        },
        quantity: item.quantity,
      };
    });

    const currentUrl = process.env.CLIENT_URL || "http://localhost:3000";

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: lineItems,
      mode: "payment",
      success_url: `${currentUrl}/success`,
      cancel_url: `${currentUrl}/cancel`,
    });

    return res.status(200).json({ id: session.id });
  } catch (error) {
    console.error("Payment Error:", error);

    if (!res.headersSent) {
      return res.status(500).json({ message: "Payment processing failed" });
    }
  }
};*/

    //send email to user
    await sendemail(
        user.email,
        user.cart.product.map((item)=>({
            name:item.product.name,
            price:item.product.price
        }))
       
    )
    //empty cart
    user.cart.products = [];
    user.cart.total = 0;
    await user.cart.save();
    await user.save();
    res.status(200).json({
      message: "get payment url",
      url: session.url,
    });

  } catch (error) {
    console.log(error);
    res.status(500).json({
      messsage: "internal server error",
    });
  }
};


const createPaymentSession = async (req, res) => {
  try {
    const userId = req.user.userId;

    // Get user's cart
    const cart = await Cart.findOne({ user: userId });
    if (!cart || cart.products.length === 0) {
      return res.status(400).json({ message: 'Cart is empty' });
    }

    // Get user email (assuming you have User model or user info attached in req.user)
    // If you don't have it, fetch from DB here
    const userEmail = req.user.email;
    if (!userEmail) {
      return res.status(400).json({ message: 'User email not found' });
    }

    // Get products info to check stock and price
    const productIds = cart.products.map(p => p.productId);
    const products = await Product.find({ _id: { $in: productIds } });

    // Prepare Stripe line items
    const lineItems = cart.products.map(cartItem => {
      const product = products.find(p => p._id.toString() === cartItem.productId.toString());

      if (!product) throw new Error(`Product ${cartItem.productId} not found`);
      if (cartItem.quantity > product.stock) throw new Error(`Insufficient stock for ${product.name}`);

      return {
        price_data: {
          currency: 'usd',
          product_data: {
            name: product.name,
            description: product.description || '',
          },
          unit_amount: Math.round(product.price * 100),
        },
        quantity: cartItem.quantity,
      };
    });

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: lineItems,
      mode: 'payment',
      success_url: `${process.env.CLIENT_URL}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.CLIENT_URL}/payment-cancelled`,
      metadata: { userId },
    });

    // Record payment with status 'pending'
    await Payment.create({
      userId,
      products: cart.products,
      total: cart.total,
      stripeSessionId: session.id,
      paymentStatus: 'pending',
    });

    // Prepare product details for email
    const productDetailsForEmail = cart.products.map(cartItem => {
      const product = products.find(p => p._id.toString() === cartItem.productId.toString());
      return {
        name: product.name,
        price: product.price,
        quantity: cartItem.quantity,
      };
    });

    // Send confirmation email
    await sendEmail(userEmail, productDetailsForEmail);

    // Empty the cart
    cart.products = [];
    cart.total = 0;
    await cart.save();

    res.json({ url: session.url });
  } catch (error) {
    console.error('Payment session creation error:', error.message);
    res.status(400).json({ message: error.message || 'Failed to create payment session' });
  }
};

module.exports = { cart, addProductToCart, updateCart, createPaymentSession };