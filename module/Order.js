const mongoose = require('mongoose');
var Schema = mongoose.Schema;

mongoose.connect("mongodb://localhost:27017/Shopping", {
  useNewUrlParser: true,
}).then((_) => console.log("Connected to Order DB"))
.catch((err) => console.error("error", err));;

const Order = mongoose.model(
  "Order",
  new Schema({
    user_id: { type: String, required: true },
    product_name: { type: String, required: true }
  })
);

module.exports = Order;