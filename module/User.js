const mongoose = require('mongoose');
var Schema = mongoose.Schema;

mongoose.connect("mongodb://localhost:27017/Shopping", {
  useNewUrlParser: true,
}).then((_) => console.log("Connected to User DB"))
.catch((err) => console.error("error", err));;

const User = mongoose.model(
  "User",
  new Schema({
    name: { type: String, required: true },
    pass: { type: String, required: true },
    email:{ type:String , required : true},
    valid: { type: Boolean, default: false },
    randomStr: { type: String, default: true }
  })
);

module.exports = User;