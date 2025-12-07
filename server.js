// Pet Tashkent API - Node.js + Express + MongoDB
// Install: npm install express cors body-parser mongoose bcrypt

const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb+srv://sadullaernazarovich_db_user:VRQs0YbVZv6IJVbI@cluster0.v9fmj3c.mongodb.net/')
.then(() => console.log('✅ MongoDB подключена'))
.catch(err => console.error('❌ Ошибка MongoDB:', err));

// ============ MONGODB SCHEMAS ============

// User Schema
const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true, trim: true },
  password: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

userSchema.index({ username: 1 });

const User = mongoose.model('User', userSchema);

// Animal Schema
const animalSchema = new mongoose.Schema({
  name: { type: String, required: true },
  type: { type: String, enum: ['dog', 'cat', 'bird', 'rabbit', 'other'], required: true },
  breed: String,
  age: String,
  gender: { type: String, enum: ['male', 'female'] },
  price: { type: Number, default: 0 },
  priceType: { type: String, enum: ['free', 'sale', 'foster'], default: 'free' },
  location: { type: String, required: true },
  district: String,
  description: { type: String, required: true },
  imageUrl: String,
  images: [String],
  urgent: { type: Boolean, default: false },
  vaccinated: { type: Boolean, default: false },
  sterilized: { type: Boolean, default: false },
  contactPhone: { type: String, required: true },
  contactName: { type: String, required: true },
  contactEmail: String,
  status: { type: String, enum: ['available', 'adopted', 'pending'], default: 'available' },
  views: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

animalSchema.index({ type: 1, location: 1, status: 1 });
animalSchema.index({ name: 'text', description: 'text' });

const Animal = mongoose.model('Animal', animalSchema);

// Shelter Schema
const shelterSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: String,
  animals: { type: Number, default: 0 },
  needs: String,
  goal: { type: Number, required: true },
  raised: { type: Number, default: 0 },
  location: { type: String, required: true },
  address: String,
  phone: { type: String, required: true },
  email: String,
  bankAccount: String,
  website: String,
  socialMedia: {
    instagram: String,
    telegram: String,
    facebook: String
  },
  coordinates: {
    lat: Number,
    lng: Number
  },
  images: [String],
  verified: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

const Shelter = mongoose.model('Shelter', shelterSchema);

// Donation Schema
const donationSchema = new mongoose.Schema({
  shelter: { type: mongoose.Schema.Types.ObjectId, ref: 'Shelter', required: true },
  amount: { type: Number, required: true },
  donorName: String,
  donorPhone: String,
  donorEmail: String,
  message: String,
  paymentMethod: { type: String, enum: ['card', 'cash', 'transfer'], default: 'card' },
  status: { type: String, enum: ['pending', 'completed', 'failed'], default: 'pending' },
  transactionId: String,
  createdAt: { type: Date, default: Date.now }
});

donationSchema.index({ shelter: 1, createdAt: -1 });

const Donation = mongoose.model('Donation', donationSchema);

// Vet Clinic Schema
const vetClinicSchema = new mongoose.Schema({
  name: { type: String, required: true },
  address: { type: String, required: true },
  district: String,
  phone: { type: String, required: true },
  email: String,
  hours: String,
  services: [String],
  rating: { type: Number, min: 0, max: 5, default: 0 },
  reviewCount: { type: Number, default: 0 },
  coordinates: {
    lat: { type: Number, required: true },
    lng: { type: Number, required: true }
  },
  emergency: { type: Boolean, default: false },
  homeVisit: { type: Boolean, default: false },
  website: String,
  images: [String],
  verified: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

vetClinicSchema.index({ 'coordinates.lat': 1, 'coordinates.lng': 1 });
vetClinicSchema.index({ name: 'text', services: 'text' });

const VetClinic = mongoose.model('VetClinic', vetClinicSchema);

// Product Schema
const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  category: { type: String, enum: ['food', 'toy', 'accessory', 'medicine', 'grooming', 'other'], required: true },
  animalType: { type: String, enum: ['dog', 'cat', 'bird', 'rabbit', 'all'], default: 'all' },
  price: { type: Number, required: true },
  description: { type: String, required: true },
  imageUrl: String,
  images: [String],
  brand: String,
  stock: { type: Number, default: 0 },
  inStock: { type: Boolean, default: true },
  featured: { type: Boolean, default: false },
  rating: { type: Number, min: 0, max: 5, default: 0 },
  reviewCount: { type: Number, default: 0 },
  contactPhone: { type: String, required: true },
  contactName: { type: String, required: true },
  location: String,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

productSchema.index({ category: 1, animalType: 1, inStock: 1 });
productSchema.index({ name: 'text', description: 'text' });

const Product = mongoose.model('Product', productSchema);

// ============ AUTH ENDPOINTS ============

// POST Register
app.post('/api/auth/register', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ 
        success: false, 
        message: 'Username и password обязательны' 
      });
    }

    if (password.length < 6) {
      return res.status(400).json({ 
        success: false, 
        message: 'Пароль должен быть минимум 6 символов' 
      });
    }

    // Check if user exists
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).json({ 
        success: false, 
        message: 'Пользователь с таким username уже существует' 
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = new User({
      username,
      password: hashedPassword
    });

    await user.save();

    res.status(201).json({
      success: true,
      message: 'Регистрация успешна',
      data: {
        id: user._id,
        username: user.username,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST Login
app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ 
        success: false, 
        message: 'Username и password обязательны' 
      });
    }

    // Find user
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Неверный username или password' 
      });
    }

    // Check password
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ 
        success: false, 
        message: 'Неверный username или password' 
      });
    }

    res.json({
      success: true,
      message: 'Вход выполнен успешно',
      data: {
        id: user._id,
        username: user.username,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// PUT Update Password
app.put('/api/auth/password', async (req, res) => {
  try {
    const { username, currentPassword, newPassword } = req.body;

    if (!username || !currentPassword || !newPassword) {
      return res.status(400).json({ 
        success: false, 
        message: 'Username, текущий и новый пароль обязательны' 
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ 
        success: false, 
        message: 'Новый пароль должен быть минимум 6 символов' 
      });
    }

    const user = await User.findOne({ username });
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'Пользователь не найден' 
      });
    }
    
    // Check current password
    const validPassword = await bcrypt.compare(currentPassword, user.password);
    if (!validPassword) {
      return res.status(401).json({ 
        success: false, 
        message: 'Неверный текущий пароль' 
      });
    }

    // Hash new password
    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();

    res.json({
      success: true,
      message: 'Пароль успешно обновлен'
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.get('/api/auth/users', async (req, res) => {
  try {
    const users = await User.find().select('-password').sort({ createdAt: -1 });
    
    res.json({
      success: true,
      count: users.length,
      data: users
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.get('/api/auth/users', async (req, res) => {
  try {
    const users = await User.find().select('-password').sort({ createdAt: -1 });
    
    res.json({
      success: true,
      count: users.length,
      data: users
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});
// GET User by username
app.get('/api/auth/user/:username', async (req, res) => {
  try {
    const user = await User.findOne({ username: req.params.username }).select('-password');
    
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'Пользователь не найден' 
      });
    }
    
    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ============ ANIMAL ENDPOINTS ============

// GET all animals with filters
app.get('/api/animals', async (req, res) => {
  try {
    const { type, location, priceType, urgent, status, search, page = 1, limit = 12 } = req.query;
    
    let query = {};
    
    if (type) query.type = type;
    if (location) query.location = new RegExp(location, 'i');
    if (priceType) query.priceType = priceType;
    if (urgent === 'true') query.urgent = true;
    if (status) query.status = status;
    
    if (search) {
      query.$text = { $search: search };
    }
    
    const animals = await Animal.find(query)
      .sort({ urgent: -1, createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec();
    
    const count = await Animal.countDocuments(query);
    
    res.json({
      success: true,
      data: animals,
      pagination: {
        total: count,
        page: parseInt(page),
        pages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET single animal by ID
app.get('/api/animals/:id', async (req, res) => {
  try {
    const animal = await Animal.findById(req.params.id);
    
    if (!animal) {
      return res.status(404).json({ success: false, message: 'Животное не найдено' });
    }
    
    // Increment views
    animal.views += 1;
    await animal.save();
    
    res.json({ success: true, data: animal });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST create new animal listing
app.post('/api/animals', async (req, res) => {
  try {
    const animal = new Animal(req.body);
    await animal.save();
    
    res.status(201).json({
      success: true,
      message: 'Объявление успешно создано',
      data: animal
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// PUT update animal listing
app.put('/api/animals/:id', async (req, res) => {
  try {
    req.body.updatedAt = Date.now();
    
    const animal = await Animal.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    
    if (!animal) {
      return res.status(404).json({ success: false, message: 'Животное не найдено' });
    }
    
    res.json({
      success: true,
      message: 'Объявление обновлено',
      data: animal
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// DELETE animal listing
app.delete('/api/animals/:id', async (req, res) => {
  try {
    const animal = await Animal.findByIdAndDelete(req.params.id);
    
    if (!animal) {
      return res.status(404).json({ success: false, message: 'Животное не найдено' });
    }
    
    res.json({ success: true, message: 'Объявление удалено' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ============ SHELTER ENDPOINTS ============

// GET all shelters
app.get('/api/shelters', async (req, res) => {
  try {
    const shelters = await Shelter.find().sort({ createdAt: -1 });
    
    res.json({
      success: true,
      count: shelters.length,
      data: shelters
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET single shelter
app.get('/api/shelters/:id', async (req, res) => {
  try {
    const shelter = await Shelter.findById(req.params.id);
    
    if (!shelter) {
      return res.status(404).json({ success: false, message: 'Приют не найден' });
    }
    
    // Get recent donations
    const donations = await Donation.find({ shelter: shelter._id })
      .sort({ createdAt: -1 })
      .limit(10);
    
    res.json({
      success: true,
      data: {
        ...shelter.toObject(),
        recentDonations: donations
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST create shelter
app.post('/api/shelters', async (req, res) => {
  try {
    const shelter = new Shelter(req.body);
    await shelter.save();
    
    res.status(201).json({
      success: true,
      message: 'Приют успешно создан',
      data: shelter
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// POST donate to shelter
app.post('/api/shelters/:id/donate', async (req, res) => {
  try {
    const shelter = await Shelter.findById(req.params.id);
    
    if (!shelter) {
      return res.status(404).json({ success: false, message: 'Приют не найден' });
    }
    
    const { amount, donorName, donorPhone, donorEmail, message, paymentMethod } = req.body;
    
    if (!amount || amount <= 0) {
      return res.status(400).json({ success: false, message: 'Неверная сумма пожертвования' });
    }
    
    const donation = new Donation({
      shelter: shelter._id,
      amount,
      donorName,
      donorPhone,
      donorEmail,
      message,
      paymentMethod,
      status: 'completed'
    });
    
    await donation.save();
    
    // Update shelter raised amount
    shelter.raised += amount;
    await shelter.save();
    
    res.json({
      success: true,
      message: 'Спасибо за пожертвование!',
      data: {
        donation,
        shelter: {
          id: shelter._id,
          name: shelter.name,
          raised: shelter.raised,
          goal: shelter.goal,
          progress: Math.round((shelter.raised / shelter.goal) * 100)
        }
      }
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// GET shelter donations
app.get('/api/shelters/:id/donations', async (req, res) => {
  try {
    const donations = await Donation.find({ shelter: req.params.id })
      .sort({ createdAt: -1 })
      .limit(50);
    
    const totalAmount = await Donation.aggregate([
      { $match: { shelter: new mongoose.Types.ObjectId(req.params.id), status: 'completed' } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);
    
    res.json({
      success: true,
      count: donations.length,
      totalAmount: totalAmount.length > 0 ? totalAmount[0].total : 0,
      data: donations
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ============ VET CLINIC ENDPOINTS ============

// GET all vet clinics
app.get('/api/vets', async (req, res) => {
  try {
    const { emergency, search, district } = req.query;
    
    let query = {};
    
    if (emergency === 'true') query.emergency = true;
    if (district) query.district = district;
    
    if (search) {
      query.$text = { $search: search };
    }
    
    const vets = await VetClinic.find(query).sort({ rating: -1 });
    
    res.json({
      success: true,
      count: vets.length,
      data: vets
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET single vet clinic
app.get('/api/vets/:id', async (req, res) => {
  try {
    const vet = await VetClinic.findById(req.params.id);
    
    if (!vet) {
      return res.status(404).json({ success: false, message: 'Клиника не найдена' });
    }
    
    res.json({ success: true, data: vet });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST create vet clinic
app.post('/api/vets', async (req, res) => {
  try {
    const vet = new VetClinic(req.body);
    await vet.save();
    
    res.status(201).json({
      success: true,
      message: 'Ветклиника успешно создана',
      data: vet
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// GET nearby vet clinics
app.get('/api/vets/nearby', async (req, res) => {
  try {
    const { lat, lng, maxDistance = 5000 } = req.query;
    
    if (!lat || !lng) {
      return res.status(400).json({ success: false, message: 'Укажите координаты (lat, lng)' });
    }
    
    const vets = await VetClinic.find({
      'coordinates.lat': {
        $gte: parseFloat(lat) - (maxDistance / 111000),
        $lte: parseFloat(lat) + (maxDistance / 111000)
      },
      'coordinates.lng': {
        $gte: parseFloat(lng) - (maxDistance / 111000),
        $lte: parseFloat(lng) + (maxDistance / 111000)
      }
    }).sort({ rating: -1 });
    
    // Calculate distances
    const vetsWithDistance = vets.map(vet => {
      const distance = calculateDistance(
        parseFloat(lat),
        parseFloat(lng),
        vet.coordinates.lat,
        vet.coordinates.lng
      );
      
      return {
        ...vet.toObject(),
        distance: Math.round(distance * 100) / 100
      };
    }).filter(v => v.distance <= maxDistance / 1000)
      .sort((a, b) => a.distance - b.distance);
    
    res.json({
      success: true,
      count: vetsWithDistance.length,
      data: vetsWithDistance
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ============ STATISTICS ENDPOINT ============

// ============ PRODUCT ENDPOINTS ============

// GET all products with filters
app.get('/api/products', async (req, res) => {
  try {
    const { category, animalType, inStock, featured, search, page = 1, limit = 12 } = req.query;
    
    let query = {};
    
    if (category) query.category = category;
    if (animalType) query.animalType = animalType;
    if (inStock === 'true') query.inStock = true;
    if (featured === 'true') query.featured = true;
    
    if (search) {
      query.$text = { $search: search };
    }
    
    const products = await Product.find(query)
      .sort({ featured: -1, createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec();
    
    const count = await Product.countDocuments(query);
    
    res.json({
      success: true,
      data: products,
      pagination: {
        total: count,
        page: parseInt(page),
        pages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET single product by ID
app.get('/api/products/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    
    if (!product) {
      return res.status(404).json({ success: false, message: 'Товар не найден' });
    }
    
    res.json({ success: true, data: product });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST create new product
app.post('/api/products', async (req, res) => {
  try {
    const product = new Product(req.body);
    await product.save();
    
    res.status(201).json({
      success: true,
      message: 'Товар успешно создан',
      data: product
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// PUT update product
app.put('/api/products/:id', async (req, res) => {
  try {
    req.body.updatedAt = Date.now();
    
    const product = await Product.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    
    if (!product) {
      return res.status(404).json({ success: false, message: 'Товар не найден' });
    }
    
    res.json({
      success: true,
      message: 'Товар обновлен',
      data: product
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// DELETE product
app.delete('/api/products/:id', async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    
    if (!product) {
      return res.status(404).json({ success: false, message: 'Товар не найден' });
    }
    
    res.json({ success: true, message: 'Товар удален' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ============ STATISTICS ENDPOINT ============

app.get('/api/stats', async (req, res) => {
  try {
    const [
      totalAnimals,
      animalsByType,
      urgentAnimals,
      freeAnimals,
      totalShelters,
      totalDonations,
      totalVets,
      emergencyVets,
      totalProducts,
      productsByCategory
    ] = await Promise.all([
      Animal.countDocuments(),
      Animal.aggregate([
        { $group: { _id: '$type', count: { $sum: 1 } } }
      ]),
      Animal.countDocuments({ urgent: true }),
      Animal.countDocuments({ priceType: 'free' }),
      Shelter.countDocuments(),
      Donation.aggregate([
        { $match: { status: 'completed' } },
        { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } }
      ]),
      VetClinic.countDocuments(),
      VetClinic.countDocuments({ emergency: true }),
      Product.countDocuments(),
      Product.aggregate([
        { $group: { _id: '$category', count: { $sum: 1 } } }
      ])
    ]);
    
    const petsByType = {};
    animalsByType.forEach(item => {
      petsByType[item._id] = item.count;
    });

    const products = {};
    productsByCategory.forEach(item => {
      products[item._id] = item.count;
    });
    
    const stats = {
      totalAnimals,
      petsByType,
      urgentAnimals,
      freeAnimals,
      shelters: totalShelters,
      donations: {
        total: totalDonations[0]?.total || 0,
        count: totalDonations[0]?.count || 0
      },
      vets: totalVets,
      emergencyVets,
      products: totalProducts,
      productsByCategory: products
    };
    
    res.json({ success: true, data: stats });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ============ UTILITY FUNCTIONS ============

function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

// ============ ERROR HANDLING ============

app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Endpoint не найден' });
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ success: false, message: 'Внутренняя ошибка сервера' });
});

// ============ START SERVER ============

app.listen(PORT, () => {
  console.log(`🐾 Pet Tashkent API запущен на порту ${PORT}`);
  console.log(`📍 http://localhost:${PORT}`);
  console.log(`\nДоступные endpoints:`);
  console.log(`  POST   /api/auth/register - Регистрация`);
  console.log(`  POST   /api/auth/login - Вход`);
  console.log(`  PUT    /api/auth/password - Изменить пароль`);
  console.log(`  GET    /api/animals - Все животные`);
  console.log(`  POST   /api/animals - Создать объявление`);
  console.log(`  GET    /api/products - Все товары`);
  console.log(`  POST   /api/products - Создать товар`);
  console.log(`  GET    /api/shelters - Все приюты`);
  console.log(`  GET    /api/vets - Все ветклиники`);
  console.log(`  GET    /api/stats - Статистика`);
});