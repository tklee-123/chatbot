const mongoose  = require("mongoose")
mongoose.connect('mongodb://0.0.0.0:27017/chatbot', {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('Connected to MongoDB'))
.catch(err => console.error('Failed to connect to MongoDB:', err));
module.exports = mongoose;