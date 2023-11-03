const express = require("express");
const BodyParser = require("body-parser");
const mongoose = require("mongoose");
const ejs = require("ejs");
const cors = require("cors");
const path = require("path");
const app = express();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const session = require('express-session')
const fs = require('fs');



const jwtSecretKey = 'AmitcarPenter';
const sessoinSecret = "hellomynameisamit";

// Middle ware
app.use(
    session({
        secret: sessoinSecret,
        resave: false,  // Set resave option to false
        saveUninitialized: false  // Set saveUninitialized option to false
    })
);
app.use(express.json());
app.use(BodyParser.json());
app.use(express.urlencoded({ extended: true }));
app.use(BodyParser.urlencoded({ extended: true }));
app.use(cors());
app.use('/css', express.static(path.join(__dirname, '../frontend/css')));
app.use('/icons', express.static(path.join(__dirname, '../frontend/icons')));
app.use('/images', express.static(path.join(__dirname, '../frontend/images')));
app.use('/js', express.static(path.join(__dirname, '../frontend/js')));
app.use('/plugins', express.static(path.join(__dirname, '../frontend/plugins')));
app.use(express.static('public'));


// Set Engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '../frontend'))

let dburl = "mongodb+srv://roameramit2001:roameramit2001@cluster0.amndb01.mongodb.net/?retryWrites=true&w=majority"
let dburlof = "mongodb://127.0.0.1/logindataAdmin"
// Connect to database
mongoose.connect(dburl).then(() => {
    console.log("DB Connected")
}).catch((err) => {
    console.log(err)
    console.log("error in mongodb")
})





// User Model
const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
    },
    password: {
        type: String,
        required: true,
    },
})

const User = mongoose.model('user', userSchema)


// Emails Domain schema
const domainemails = new mongoose.Schema({
    DomainName: { type: String },
    Email: { type: String, unique: true },
    createdAt: { type: Date, default: Date.now }, // Add createdAt field to store the creation date
    category: { type: String, default: "" }, // Add the "category" field of type String
});

const DomainEmail = mongoose.model('domainemails', domainemails);



//Category Schema
const categorySchema = new mongoose.Schema({
    category: {
        type: String,
        required: true,
        unique: true,
    }
});

const Category = mongoose.model('Category', categorySchema);




const securePassword = async (password) => {
    try {
        const passwordHash = await bcrypt.hash(password, 10)
        return passwordHash
    } catch (error) {
        console.log(error.massage)
    }
}



// Routing 


// Login Page Loader
app.get("/", (req, res) => {
    try {
        res.render("page-login")
    } catch (error) {
        console.log(error)
    }
})



// Login the User
app.post("/", async (req, res) => {
    const { email, password } = req.body
    // console.log(email , password)
    try {
        const user = await User.findOne({ email })
        if (user) {
            const passwordMatch = await bcrypt.compare(password, user.password)
            if (passwordMatch) {
                req.session.user_id = user._id
                console.log('Login Success Fully')
                const token = jwt.sign({ userId: user._id }, jwtSecretKey);
                return res.redirect('/dashboard')

            }
            else {
                return res.render('page-login', {
                    massage: 'Email and Password is Incorrect',
                })
            }
        } else {
            return res.render('page-login', {
                massage: 'Email and Password is Incorrect',
            })
        }

    } catch (error) {
        console.log("eroor")
        console.error(error)
    }
})




// Register Page Loader
app.get("/register", (req, res) => {
    try {
        res.render("page-register")
    } catch (error) {
        console.log(error)
    }
})



//Register post api 
app.post("/register", async (req, res) => {
    const { name, email, password } = req.body
    console.log(req.body)
    try {
        // Check if the email is already registered
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(409).json({ error: 'Email already registered.' });
        }
        const hashedPassword = await securePassword(password)
        // Create a new user document and save it to the database
        const newUser = new User({ name, email, password: hashedPassword });
        await newUser.save();
        const token = jwt.sign({ userId: newUser._id }, 'AMITCARPENTER')

        return res.status(201).json({ message: 'Registration successful!', user: newUser });
    } catch (error) {
        console.error('Error registering user:', error);
        return res.status(500).json({ error: 'Internal server error.' });
    }
})


// Lock Page Loader
app.get("/lock", (req, res) => {
    try {
        res.render("page-lock")
    } catch (error) {
        console.log(error)
    }
})


// Dashboard Page Loader
app.get("/dashboard", async (req, res) => {
    try {
        // Get the current date
        const currentDate = new Date();

        // Calculate the start and end of today
        const startOfDay = new Date(currentDate);
        startOfDay.setHours(0, 0, 0, 0); // Set to the beginning of the day
        const endOfDay = new Date(currentDate);
        endOfDay.setHours(23, 59, 59, 999); // Set to the end of the day

        // Find data for today using the "createdAt" field
        const todayData = await DomainEmail.find({
            createdAt: {
                $gte: startOfDay,
                $lte: endOfDay
            }
        });

        const todayEmails = todayData.length;



        // Calculate Current Week of the month 
        const startOfWeek = new Date(currentDate);
        startOfWeek.setDate(currentDate.getDate() - currentDate.getDay() + 1);
        startOfWeek.setHours(0, 0, 0, 0);

        const endOfWeek = new Date(currentDate);
        endOfWeek.setDate(startOfWeek.getDate() + 6);
        endOfWeek.setHours(23, 59, 59, 999);



        // Find data for the current week using the "createdAt" field
        const weeklyData = await DomainEmail.find({
            createdAt: {
                $gte: startOfWeek,
                $lte: endOfWeek
            }
        });
        const weeklyEmails = weeklyData.length;



        // calculte Current Month
        const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
        // Calculate the end of the current month
        const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);

        // Find data for the current month using the "createdAt" field
        const monthlyData = await DomainEmail.find({
            createdAt: {
                $gte: startOfMonth,
                $lte: endOfMonth
            }
        });


        const MonthlyEmails = monthlyData.length



        // Calculate Total Data 
        const totaldata = await DomainEmail.find()
        const totalEmails = totaldata.length;

        // Render the EJS template and pass the data as variables
        res.render("index", { weeklyData, totalEmails, totaldata, todayData, todayEmails, monthlyData, weeklyEmails, MonthlyEmails });
    } catch (error) {
        console.log(error);
    }
});





// Email Inbox Page Loader
app.get("/email-inbox", (req, res) => {
    try {
        res.render("email-inbox")
    } catch (error) {
        console.log(error)
    }
})


// Email Read Page Loader
app.get("/email-read", (req, res) => {
    try {
        res.render("email-read")
    } catch (error) {
        console.log(error)
    }
})


// Email Compose Page Loader
app.get("/email-compose", (req, res) => {
    try {
        res.render("email-compose")
    } catch (error) {
        console.log(error)
    }
})



//Data Table Page Loader
app.get("/table-datatable", (req, res) => {
    try {
        res.render("table-datatable")
    } catch (error) {
        console.log(error)
    }
})



//Api for Date Filter
/// Filter by date For Website
app.get('/filterDatabydate', async (req, res) => {
    try {
        const startDate = new Date(req.query.startDate);

        const endDate = new Date(req.query.endDate);
        endDate.setHours(23, 59, 59, 999);
        // Fetch the data from the database based on the date range
        const filteredData = await DomainEmail.find({
            createdAt: {
                $gte: startDate,
                $lt: endDate,
            },
        });
        res.json(filteredData);
    } catch (error) {
        console.error('Error occurred:', error);
        res.status(500).json({ error: 'An unexpected error occurred.' });
    }
});



// Filter by day For |Website
app.get('/filterDatabyday', async (req, res) => {
    try {

        const selectedDate = new Date(req.query.selectedDate);
        console.log(selectedDate)

        // Set the startDate to the beginning of the selected day (00:00:00)
        const startDate = new Date(selectedDate);
        startDate.setHours(0, 0, 0, 0);

        // Set the endDate to the end of the selected day (23:59:59)
        const endDate = new Date(selectedDate);
        endDate.setHours(23, 59, 59, 999);

        // Fetch the data from the database for the specified day
        const filteredData = await DomainEmail.find({
            createdAt: {
                $gte: startDate,
                $lte: endDate,
            },
        });

        res.json(filteredData);
    } catch (error) {
        console.error('Error occurred:', error);
        res.status(500).json({ error: 'An unexpected error occurred.' });
    }
});




// POST Route For Both 
app.post('/api/categories', (req, res) => {

    const { category } = req.body;
    console.log(category)
    // Validate the request body
    if (!category) {
        return res.status(400).json({ error: 'Name and description are required.' });
    }

    // Create a new category using the Category model
    const newCategory = new Category({
        category
    });

    // Save the new category to the database
    newCategory.save()
        .then((savedCategory) => res.status(201).json(savedCategory))
        .catch((err) => {
            res.status(500).json({ error: 'Failed to create category.' })
            console.log(err)
        });
});


// Get the Category  for Both
app.get('/api/categories', async (req, res) => {
    // Use the Category model to find all categories in the database
    await Category.find()
        .then((categories) => {
            res.json(categories)
        })
        .catch((err) => res.status(500).json({ error: 'Failed to fetch categories.' }));

});



// Delete Category
app.delete('/api/categories', async (req, res) => {
    let categoryValues = req.query.selectedCategory; // Assuming 'selectedCategory' is either an array or a comma-separated string
    console.log(categoryValues);

    try {
        let selectedCategoryArray;

        if (Array.isArray(categoryValues)) {
            selectedCategoryArray = categoryValues;
        } else if (typeof categoryValues === 'string') {
            // Split the comma-separated string into an array
            selectedCategoryArray = categoryValues.split(',');
        } else {
            return res.status(400).json({ success: false, message: 'Invalid input. selectedCategory should be an array or a comma-separated string.' });
        }

        console.log(selectedCategoryArray);

        // Delete categories based on their values
        const result = await Category.deleteMany({ category: { $in: selectedCategoryArray } });

        if (result.deletedCount === 0) {
            return res.status(404).json({ success: false, message: 'Categories not found.' });
        }

        return res.json({ success: true, message: 'Categories deleted successfully.' });
    } catch (error) {
        console.error('Error while deleting categories:', error);
        return res.status(500).json({ success: false, message: 'An error occurred while deleting the categories.' });
    }
});





// Filter the data date and category in website Emails
app.get('/filterdateandcategory', async (req, res) => {
    try {
        const selectedCategories = req.query.selectedCategory;
        console.log(selectedCategories)

        let selectedCategoryArray;

        selectedCategoryArray = Array.isArray(selectedCategories)
            ? selectedCategories
            : [selectedCategories];

        if (typeof selectedCategories === 'string') {
            // Split the comma-separated string into an array
            selectedCategoryArray = selectedCategories.split(',');

        }
        const startDate = new Date(req.query.startDate);
        const endDate = new Date(req.query.endDate);

        // Set the endDate to the end of the selected day (23:59:59)
        endDate.setHours(23, 59, 59, 999);

        // Create the query object with 'category' and 'createdAt' fields
        const query = {
            category: { $in: selectedCategoryArray },
            createdAt: {
                $gte: startDate,
                $lt: endDate,
            },
        };

        // Fetch the data from the database based on the category and date range
        const filteredData = await DomainEmail.find(query);

        res.json(filteredData);
    } catch (error) {
        console.error('Error occurred:', error);
        res.status(500).json({ error: 'An unexpected error occurred.' });
    }
});



// Filter By Data by Category  For Website
app.get('/api/filterDatabyCategory', async (req, res) => {
    const selectedCategories = req.query.selectedCategory;
    console.log(selectedCategories)
    try {
        let selectedCategoryArray;

        selectedCategoryArray = Array.isArray(selectedCategories)
            ? selectedCategories
            : [selectedCategories];

        if (typeof selectedCategories === 'string') {
            // Split the comma-separated string into an array
            selectedCategoryArray = selectedCategories.split(',');
        }
        // selectedCategoryArray = selectedCategoryArray.split(',');
        // console.log(selectedCategoryArray)

        // Create the query object with the 'category' field
        const query = { category: { $in: selectedCategoryArray } };

        // Create the query object with the 'category' field
        // Create the query object with the 'category' field
        // const query = { category: { $in: selectedCategory } };
        // Perform the query to get the filtered data
        const filteredData = await DomainEmail.find(query);
        res.json(filteredData);
    } catch (error) {
        console.error('Error occurred:', error);
        res.status(500).json({ error: 'An unexpected error occurred. Please try again later.' });
    }
});




//Delete Row 
app.delete('/domainEmail/:id', async (req, res) => {
    try {
        const id = req.params.id;
        // Find the profile by ID and delete it from the database
        const deletedProfile = await DomainEmail.findByIdAndDelete(id);
        if (!deletedProfile) {
            return res.status(404).json({ message: 'Profile not found' });
        }
        res.json({ message: 'Profile deleted successfully', deletedProfile });
    } catch (error) {
        console.error('Error occurred:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});





// Save Doamin emails in data base 
app.post('/api/save-emails', async (req, res) => {
    const { Email, DomainName, category } = req.body;

    console.log(category)
    const existingLead = await DomainEmail.findOne({ Email: Email });

    if (existingLead) {
        // If the email exists, render the error EJS template
        return res.status(400).json({ success: false, message: 'Duplicate email' });
    }

    const newEmail = new DomainEmail({ DomainName: DomainName, Email: Email, category: category });
    await newEmail.save();

    console.log('Emails saved successfully to the database!');
    return res.json({ message: 'Emails saved successfully to the database' });
});


// Logout ..//
app.get("/logout", async (req, res) => {
    try {
        //   req.session.destroy()
        console.log("Logout")
        return res.redirect('/')
    } catch (error) {
        console.log(error)
    }
})



//Profile Loader
app.get("/Profile", async (req, res) => {
    try {
        res.render("app-profile")
    } catch (error) {
        console.log(error)
    }
})






// Filter data btoth in website emails  day and category
app.get('/api/filterDataboth', async (req, res) => {
    const selectedCategories = req.query.selectedCategory;
    console.log(selectedCategories)

    let selectedCategoryArray;

    selectedCategoryArray = Array.isArray(selectedCategories)
        ? selectedCategories
        : [selectedCategories];

    if (typeof selectedCategories === 'string') {
        // Split the comma-separated string into an array
        selectedCategoryArray = selectedCategories.split(',');

    }
    const selectedDate = new Date(req.query.selectedDate);

    // Set the startDate to the beginning of the selected day (00:00:00)
    const startDate = new Date(selectedDate);
    startDate.setHours(0, 0, 0, 0);

    // Set the endDate to the end of the selected day (23:59:59)
    const endDate = new Date(selectedDate);
    endDate.setHours(23, 59, 59, 999);

    try {
        // Create the query object with both 'category' and 'createdAt' fields
        const query = {
            category: { $in: selectedCategoryArray },
            createdAt: {
                $gte: startDate,
                $lte: endDate,
            },
        };

        // Perform the query to get the filtered data
        const filteredData = await DomainEmail.find(query);

        res.json(filteredData);
    } catch (error) {
        console.error('Error occurred:', error);
        res.status(500).json({ error: 'An unexpected error occurred. Please try again later.' });
    }
});



// Define route for user registration
app.post('/registerLinkedin', async (req, res) => {
  const { name, email, password } = req.body; // Extracting user data from the request body

  try {
      console.log(req.body);
      console.log("hello");
    // Check if the email is already registered
    const existingUser = await User.findOne({ email });

      console.log("secon");
    if (existingUser) {
      return res.status(400).json({ message: "Email already exists" });
    }

      console.log("thired");
    // Hash the password using bcrypt for security
    const hashedPassword = await bcrypt.hash(password, 10);

      console.log("ahse");
    // Create a new user based on the schema
    const newUser = new User({
      name,
      email,
      password: hashedPassword, // Store the hashed password in the database
    });

      console.log("savebefore");
    // Save the new user to the database
    await newUser.save();

      console.log("saved");
    res.status(201).json({ message: "User registered successfully" });
  } catch (error) {
    res.status(500).json({ message: "Registration failed" });
  }
});





app.listen(4000, () => {
    console.log("Server is working on 4000 ")
})




// "engines": {
//     "node": ">=14.20.1"
// },
