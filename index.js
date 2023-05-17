const express = require('express')
const cors = require('cors');
const jwt = require('jsonwebtoken')
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const app = express()
require('dotenv').config()
const port = process.env.PORT || 5000;


// middleware
app.use(cors())
app.use(express.json())



// const uri = "mongodb+srv://<username>:<password>@cluster0.0rmdzda.mongodb.net/?retryWrites=true&w=majority";
// const uri = "mongodb://UD5S5AWU1Q4RP6gA:car-doctor@ac-wotlaa2-shard-00-00.0rmdzda.mongodb.net:27017,ac-wotlaa2-shard-00-01.0rmdzda.mongodb.net:27017,ac-wotlaa2-shard-00-02.0rmdzda.mongodb.net:27017/?ssl=true&replicaSet=atlas-as340s-shard-0&authSource=admin&retryWrites=true&w=majority";
// const uri = "mongodb+srv://UD5S5AWU1Q4RP6gA:car-doctor@cluster0.0rmdzda.mongodb.net/?retryWrites=true&w=majority";
var uri = "mongodb://car-doctor:UD5S5AWU1Q4RP6gA@ac-wotlaa2-shard-00-00.0rmdzda.mongodb.net:27017,ac-wotlaa2-shard-00-01.0rmdzda.mongodb.net:27017,ac-wotlaa2-shard-00-02.0rmdzda.mongodb.net:27017/?ssl=true&replicaSet=atlas-as340s-shard-0&authSource=admin&retryWrites=true&w=majority";

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});
const verifyToken = (req,res,next) =>{
    console.log('hitte jwt');
    const authorization = req.headers.authorization;
    if (!authorization) {
        return res.send({error: true,message : 'unAuthorized'})
    }
    const token = authorization.split(' ')[1]
    jwt.verify(token,process.env.ACCESS_token,(error,decoded) =>{
        if (error) {
            return res.send({error: true,message : 'unAuthorized'})
        }
        req.decoded = decoded
        next()
    })

}
async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();

    const serviceCollection = client.db('carDoctor').collection('services');
    const bookCollection = client.db('carDoctor').collection('book');
    

    // jwt rout
     app.post('/jwt',(req,res) =>{
        const user = req.body;
        console.log(user);
        const token = jwt.sign(user,process.env.ACCESS_token,{
            expiresIn:5
        })
        console.log(token);
        res.send({token})
     })
    // sevice rout
    app.get('/services',async(req,res) =>{
        const cursor = serviceCollection.find();
        const result = await cursor.toArray();
        res.send(result)
    })
    app.get('/services/:id',async(req,res) =>{
        const id = req.params.id;
        const query = {_id : new ObjectId(id)}
        const option = {projection: {title: 1, img: 1, price: 1, service_id: 1 ,img : 1}}
        const result = await serviceCollection.findOne(query,option)
        res.send(result)
    })

    // bookings

    app.post('/bookings',async(req,res) =>{
        const booking = req.body;
        console.log(booking);
        const result = await bookCollection.insertOne(booking)
        res.send(result)
    })
    app.get('/bookings',verifyToken,async(req,res) =>{
        
        const decoded = req.decoded;
        if (decoded.email != req.query.email) {
            res.send({error : 1 , message : "unauthorized access"})
        }
        console.log('pice ' ,decoded);

        let query = {};
        if (req.query?.email) {
            query = {email: req.query?.email}
        }
        console.log(req.headers);
        const result = await bookCollection.find(query).toArray();
        res.send(result)
    })
    app.patch('/bookings/:id',async(req,res) =>{
        const id = req.params.id;
        const filter = {_id : new ObjectId(id)}
        const updateBooking = req.body;
        const updateDoc = {
            $set:{
                status:updateBooking.status
            }
        }
        
        const result = await bookCollection.updateOne(filter,updateDoc)
        res.send(result)
    })
    app.delete('/bookings/:id',async(req,res) =>{
        const id = req.params.id;
        const query = {_id : new ObjectId(id)};
        const result =await bookCollection.deleteOne(query);
        res.send(result)
    })

    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);


app.get('/', (req,res) =>{
    res.send('doctor is running')
})

app.listen(port , () =>{
    console.log(`car is running on port ${port}`);
})
