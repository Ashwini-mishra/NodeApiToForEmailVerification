require('dotenv').config();
const express = require("express");
const app = express();
const bcrypt = require('bcrypt');
const User = require("./module/User");
const Order = require("./module/Order");
const bodyParser =require("body-parser");
var jwt = require("jsonwebtoken");
let SendMail = require('./SendMail');

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// token generate
const generateAccessToken = (id) => {
    return jwt.sign({ id }, `${process.env.JWT_SECRET_KEY}`);
  };

// authenticate the user
let user_id = "";
const authenticate = async(req , res , next) =>
{
    try{
        const decoded = await jwt.verify(
            // requesting the token from the header to authenticate
            req.headers.authorization,
            process.env.JWT_SECRET_KEY
            
        );
        // console.log("----------decoded :",decoded);
        // console.log(decoded);
        if (!decoded) {
          return res.send("Unauthenticated User");
        }
        user_id = decoded.id;

        
            next();
        
      } catch (err) {
        //   console.log(err)
        return res.send(err.message);
      }
      
};

// random string generator
const randomString =() =>{
    const len =8 ;
    let randomStr = '';
    for(let i=0 ; i<len ; i++)
    {
        const ch =Math.floor((Math.random() * 100)+1);
        randomStr += ch;
    }
    return randomStr;
}

// create users
app.post('/Register', async(req,res)=>{
    let {name ,pass,email} =req.body;
    const saltRounds = 10;
    pass=String(pass);
    let random = randomString();
    let code = `<a href="http://localhost:8000/verify/?randomStr=${random}">http://localhost:8000/verify/?randomStr=${random}</a>`;
    
    let hash=await hashing(pass,saltRounds);
    let data = await new User({ name:name ,pass:hash ,email:email ,randomStr:random});
    data.save();
    SendMail.sendMail(email,code ,name);
    res.send("successfully posted");
})

const hashing=async(pass,salt)=>{
    let hash=await bcrypt.hash(pass,salt) ;
    return hash;   
}

// login
app.post('/login', async (req,res)=>{
    let{email ,pass} = req.body;
    if(email !== "" && pass !== "")
    {
        let data = await User.findOne({email});
        pass=String(pass);
        await bcrypt.compare(pass, data.pass, ((err, result)=> {
            // console.log("data result",result);
            if(result && data.valid)
            {
                // console.log("data id",data._id);
                let token = generateAccessToken(data._id);
                res.send(token);
            }else{
                res.send("error to find");
            }
        }));   
    }else{
        console.log("not found");
    }
})


// Order Placement
app.post("/order", authenticate ,async(req ,res)=>{
    let { product_name } = req.body;
    let user=user_id;
    let data = await Order({user_id:user , product_name:product_name});
    data.save();
    console.log("sucessfully placed");
    if(data)
    {
        res.send("Product placed sucessfully");
    }else{
        res.send("not");
    }
})


// Get the currently logined user placed order
app.get("/order", authenticate ,async(req ,res)=>{
    let id  = user_id;
    let data = await Order.find({ user_id :id});
    res.json(data);
})


// get the particular order detail from the cart 
app.get("/order/:order_id", authenticate ,async(req,res) =>{
    let user = user_id;
    let id = req.params.order_id;
    let data = await Order.findOne({ _id : id });

    if(user == data.user_id)
    {
        console.log(user)
        if(data)
        {
            console.log(data);
            console.log("successufully get the element");
            res.send(data)
        }
    }else{
        res.send("not created by your id");
    }
})


// api email verification
app.get('/verify/',async(req ,res)=>{
    let verify = req.query.randomStr;
    console.log(verify);
    let myquery = {randomStr: verify};
    let newvalues = {$set: {valid: true} };
    let data = await User.updateOne(myquery,newvalues);
    if(data)
    res.send(data);
    else
    res.send("not verified");
}) 

// link generate to reset password
app.get("/linkGrenereate",authenticate ,async(req, res)=>{
    let {email} = req.body;
    let data = await User.findOne({email});
    if(data)
    {
        let code = `http://localhost:8000/request/?email=${data.email}`
        SendMail.sendMail(email , code , "sir/maam");
        res.send("reset link is generated please check your mail");
    }else{
        res.send("try again link not genereted");
    } 
})


// request for the reset password
app.post('/request/',authenticate, async(req,res) => {
    let  email = req.query.email;
    let {pass ,repass} = req.body;
    let data = await User.findOne({email}); 
    if(data.valid)
    {
        // console.log("email",email)
        if(pass !== "" && repass !=="")
        {
            let salt=10;
            repass =String(repass)
            let hash=await hashing(repass,salt);
            pass = String(hash);
            let data = await User.updateOne({email : email},{$set :{pass : pass}})
            if(data)
            {
                let code ="Sucessfully updated your password";
               await SendMail.sendMail(email ,code , "sir/maam");
               res.send("your password is updated")
            }
            else{
                res.send("not matched")
            }
        }else{
            res.send("pass must be something");
        }
    }else{
        res.send("email id not matched");
    }
})

// port running status
app.listen(8000 , ()=>console.log('Port is running on port 8000'));