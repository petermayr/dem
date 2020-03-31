/* // CRUD create read update delete

const mongodb = require('mongodb');
const MongoClient = mongodb.MongoClient;

const connectionURL = "mongodb+srv://justadmin:yEI78GWu1esd@cluster0-asdgj.mongodb.net/sholix?retryWrites=true&w=majority";
const databaseName = 'testdrive'

MongoClient.connect(connectionURL, { useNewUrlParser: true}, (error, client) => {
    if(error) {
        console.log(""+error);
        return console.log('Unable to connect to database!')
    }

    console.log('Connected correctly!')
})
 */
var express = require('express');
var MongoClient = require('mongodb').MongoClient;
var bodyParser = require('body-parser');
var crypto = require('crypto');

var url = "mongodb+srv://justadmin:yEI78GWu1esd@cluster0-asdgj.mongodb.net/sholix?retryWrites=true&w=majority";

const port = process.env.PORT || 3000

//Create Express Service
var app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));

/* MongoClient.connect(url, { useNewUrlParser: true}, function(err, db) {
  if (err) throw err;
  var dbo = db.db("sholix");
  var myobj = { name: "Company Inc", address: "Highway 37" };
  dbo.collection("user").insertOne(myobj, function(err, res) {
    if (err) throw err;
    console.log("1 document inserted");
    
    
  }); */

/*   app.listen(3000,()=>{
    console.log('Connected to Mongo Server, WebService running on port 3000.');
})
});
 */

//PASSWORD ULTILS
//CREATE FUNCTION TO RANDOM SALT
var genRandomString = function(length){
    return crypto.randomBytes(Math.ceil(length/2))
        .toString('hex') /* convert to hexa format */
        .slice(0,length);
};

var sha512 = function(password,salt){
    var hash = crypto.createHmac('sha512', salt);
    hash.update(password);
    var value = hash.digest('hex');
    return {
        salt:salt,
        passwordHash:value
    };
};

function saltHashPassword(userPassword){
    var salt = genRandomString(16); //Create 16 random characters 
    var passwordData = sha512(userPassword,salt);
    return passwordData;
};

function checkHashPassword(userPassword, salt){
    var passwordData = sha512(userPassword, salt);
    return passwordData;
};


MongoClient.connect(url,{useNewUrlParser: true}, function(err, client){
    if(err)
        console.log('Unable to connect to mongoDB server.Error', err);
    else{

        //Register
        app.post('/register', (request, response, next) => {
            var post_data = request.body;

            var plaint_password = post_data.password;
            var hash_data = saltHashPassword(plaint_password);

            var password = hash_data.passwordHash; // Save password hash
            var salt = hash_data.salt; // Save salt

            var name = post_data.name;
            var email = post_data.email;

            var insertJson = {
                'email': email,
                'password': password,
                'salt': salt,
                'name': name
            };
            var db = client.db('sholix');
            
        
             //Check exists email
            db.collection('user')
                .find({'email':email}).count(function(err,number){
                    if(number != 0)
                        {
                        response.json('Email already exists');
                        console.log('Email already exists');
                    }
                    else{
                        //Insert data
                        db.collection('user')
                            .insertOne(insertJson,function(error,res){
                                response.json('Registration success');
                                console.log('Registration success');
                            })
                    }
            })
        });

        app.post('/login', (request, response, next) => {
            var post_data = request.body;

            var email = post_data.email;
            var userPassword = post_data.password;

            
            var db = client.db('sholix');
        

        //Check exists email
        db.collection('user')
            .find({'email':email}).count(function(err,number){
                if(number == 0)
                    {
                        response.json('Email does not exist');
                        console.log('Email does not exist');
                    }
                    else{
                        //Insert data
                        db.collection('user')
                            .findOne({'email':email},function(err,user){
                                var salt = user.salt; //Get salt from user
                                var hashed_password = checkHashPassword(userPassword,salt).passwordHash; //Hash password with salt
                                var encrypted_password = user.password; //Get password from user
                                if(hashed_password == encrypted_password){
                                    response.json('Login success');
                                    console.log('Login success');
                                }
                                else {
                                    response.json('Wrong password');
                                    console.log('Wrong password');
                                }
                            })
                        
                    }
            })
        }); 
 
        //Start Web Server
        app.listen(port,()=>{
            console.log('Connected to Mongo Server, WebService running on port '+port);
        })
    }
}) 