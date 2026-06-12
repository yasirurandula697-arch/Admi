const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const cloudinary = require('cloudinary').v2;
const multer = require('multer');

const app = express();
app.use(express.json());
app.use(cors());

// 1. MongoDB Connection String
const MONGO_URI = process.env.MONGO_URI;

// 2. Cloudinary Configuration
cloudinary.config({
  cloud_name: 'dzjqsj65m',
  api_key: '575893172188643',
  api_secret: 'BY3YItebFWCBWWk0z6b3XuJRzyM'
});

// 📸 [object Object] එක නැති කරන්න අපි Multer එක Memory Storage එකට මාරු කරනවා
const storage = multer.memoryStorage(); 
const upload = multer({ storage: storage });

mongoose.connect(MONGO_URI)
  .then(() => console.log('Admin Panel connected to Database!'))
  .catch(err => console.error('Database connection error:', err));
// Database Schema
const itemSchema = new mongoose.Schema({
  category: { type: String, required: true },
  title: { type: String, required: true },
  price: { type: Number, required: true },
  image: { type: String, required: true }, // මෙතනට වැටෙන්නේ Cloudinary ලින්ක් එක
  description: String,
  level: Number,
  skins: String,
  subscribers: String,
  followers: String,
  diamondCount: Number,
  status: { type: String, default: 'available' }
}, { timestamps: true });

const Item = mongoose.model('Item', itemSchema);

// ---- API ROUTES ----

// බඩු ටික Table එකට ගන්න එක
app.get('/api/admin/items', async (req, res) => {
  try {
    const items = await Item.find().sort({ createdAt: -1 });
    res.json(items);
  } catch (err) { res.status(500).json(err); }
});
// ---- මේ කොටස විතරක් වෙනස් කරන්න මචං ----
app.post('/api/admin/add', upload.single('image'), async (req, res) => {
  try {
    const productData = req.body;
    
    if (!req.file) {
      return res.status(400).json({ success: false, message: "Please upload an image!" });
    }

    // 🚀 Multer Memory එකෙන් කෙලින්ම Cloudinary එකට Image එක Upload කරන සිරාම ක්‍රමය
    const uploadToCloudinary = () => {
      return new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          { folder: 'rickey_store_products' },
          (error, result) => {
            if (result) resolve(result);
            else reject(error);
          }
        );
        stream.end(req.file.buffer);
      });
    };

    const cloudinaryResult = await uploadToCloudinary();
    productData.image = cloudinaryResult.secure_url; // 🔗 Cloudinary ලින්ක් එක ගන්නවා

    const newItem = new Item(productData);
    await newItem.save();
    res.status(201).json({ success: true });

  } catch (err) { 
    // 🔍 දැන් මොකක් හරි වැරදුණොත් නියම හේතුව අකුරෙන් අකුර ලොග්ස් වල වදිනවාමයි!
    console.error("🔴 NEW DETAILED UPLOAD ERROR:");
    console.error(err); 
    
    res.status(400).json({ success: false, message: err.message || "Server Error" }); 
  }
});

// Status මාරු කරන්න (Available / Sold)
app.put('/api/admin/status/:id', async (req, res) => {
  try {
    await Item.findByIdAndUpdate(req.params.id, { status: req.body.status });
    res.json({ success: true });
  } catch (err) { res.status(500).json({ success: false }); }
});

// Delete කරන්න
app.delete('/api/admin/delete/:id', async (req, res) => {
  try {
    await Item.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ success: false }); }
});


// ---- ADMIN PANEL UI ----
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Rickey Store - Private Admin</title>
      <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;700&display=swap" rel="stylesheet">
      <style>
        * { margin:0; padding:0; box-sizing:border-box; font-family:'Poppins', sans-serif; }
        body { background:#f8f9fa; padding:40px 10%; color:#212529; }
        .login-screen { position:fixed; top:0; left:0; width:100%; height:100%; background:#ffffff; display:flex; flex-direction:column; justify-content:center; align-items:center; z-index:99999; }
        .login-box { width:320px; text-align:center; }
        .login-box input { width:100%; padding:12px; margin:10px 0; border:1px solid #ced4da; border-radius:6px; font-size:14px; text-align:center; }
        .login-box button { width:100%; background:#007bff; color:white; border:none; padding:12px; border-radius:6px; font-weight:600; cursor:pointer; }
        
        h2 { margin-bottom:20px; font-weight:700; color:#007bff; }
        .form-box { background:#ffffff; padding:30px; border-radius:12px; border:1px solid #e9ecef; box-shadow:0 4px 6px rgba(0,0,0,0.02); margin-bottom:40px; }
        .form-group { margin-bottom:15px; display:flex; flex-direction:column; }
        label { font-weight:600; margin-bottom:5px; font-size:14px; }
        input, select, textarea { padding:10px; border:1px solid #ced4da; border-radius:6px; font-size:14px; }
        input[type="file"] { padding:5px; border:none; }
        button { background:#007bff; color:white; border:none; padding:12px; border-radius:6px; font-weight:600; cursor:pointer; transition:all 0.2s; margin-top:10px; }
        button:hover { background:#0056b3; }
        .dynamic-field { display:none; }
        table { width:100%; border-collapse:collapse; background:white; border-radius:12px; overflow:hidden; border:1px solid #e9ecef; }
        th, td { padding:15px; text-align:left; border-bottom:1px solid #e9ecef; }
        th { background:#f1f3f5; font-weight:600; }
        .btn-sold { background:#dc3545; color:white; padding:5px 10px; border-radius:4px; font-size:12px; border:none; cursor:pointer; }
        .btn-avail { background:#28a745; color:white; padding:5px 10px; border-radius:4px; font-size:12px; border:none; cursor:pointer; }
        .badge { padding:4px 8px; border-radius:4px; font-size:12px; font-weight:600; }
        .badge-available { background:#e6f4ea; color:#137333; }
        .badge-sold { background:#fce8e6; color:#c5221f; }
        .btn-submit { display: flex; align-items: center; justify-content: center; gap: 10px; }
        .spinner { display:none; width: 20px; height: 20px; border: 3px solid #fff; border-bottom-color: transparent; border-radius: 50%; animation: rotation 1s linear infinite; }
        @keyframes rotation { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
      </style>
    </head>
    <body>

      <!-- 🔐 Password Security Screen -->
      <div id="loginScreen" class="login-screen">
        <div class="login-box">
          <h3 style="margin-bottom:10px;">Enter Secret Admin Password</h3>
          <input type="password" id="adminPass" placeholder="Password එක ගහන්න">
          <button onclick="checkPassword()">Login to Dashboard</button>
        </div>
      </div>

      <h2>Rickey Store Private Dashboard</h2>

      <!-- Add Form -->
      <div class="form-box">
        <h3 style="margin-bottom:15px;">Add New Listing</h3>
        <form id="addListingForm" enctype="multipart/form-data">
          <div class="form-group"><label>Category</label>
            <select id="category" name="category" onchange="handleCategoryChange()" required>
              <option value="freefire">Free Fire Accounts</option>
              <option value="youtube">YouTube Channels</option>
              <option value="tiktok">TikTok Profiles</option>
              <option value="diamonds">💎 Diamond Packs</option>
            </select>
          </div>
          <div class="form-group"><label>Title</label><input type="text" id="title" name="title" required></div>
          <div class="form-group"><label>Price (LKR)</label><input type="number" id="price" name="price" required></div>
          
          <!-- 📸 මෙන්න දැන් ලින්ක් බොක්ස් එක වෙනුවට ෆයිල් සිලෙක්ට් කරන බටන් එක තියෙනවා -->
          <div class="form-group"><label>Upload Account Screenshot/Image</label><input type="file" id="image" name="image" accept="image/*" required></div>

          <div id="ff-fields" class="dynamic-field" style="display:block;">
            <div class="form-group"><label>Level</label><input type="number" id="level" name="level"></div>
            <div class="form-group"><label>Evo Skins</label><input type="text" id="skins" name="skins"></div>
          </div>
          <div id="yt-fields" class="dynamic-field"><div class="form-group"><label>Subscribers</label><input type="text" id="subscribers" name="subscribers"></div></div>
          <div id="tt-fields" class="dynamic-field"><div class="form-group"><label>Followers</label><input type="text" id="followers" name="followers"></div></div>
          <div id="dia-fields" class="dynamic-field"><div class="form-group"><label>Diamond Count</label><input type="number" id="diamondCount" name="diamondCount"></div></div>

          <div class="form-group"><label>Description</label><textarea id="description" name="description" rows="2"></textarea></div>
          
          <button type="submit" class="btn-submit" id="submitBtn">
            <span class="spinner" id="btnSpinner"></span>
            <span id="btnText">Publish Live</span>
          </button>
        </form>
      </div>

      <!-- Live Manage Table -->
      <h3 style="margin-bottom:15px;">Live Listings</h3>
      <table>
        <thead>
          <tr><th>Image</th><th>Title</th><th>Category</th><th>Price</th><th>Status</th><th>Actions</th></tr>
        </thead>
        <tbody id="admin-table"></tbody>
      </table>

      <script>
        function checkPassword() {
          const pass = document.getElementById('adminPass').value;
          if(pass === "1234") { 
            document.getElementById('loginScreen').style.display = 'none';
            setTimeout(loadItems, 500);
          } else { alert("Wrong Password! Try again."); }
        }

        function handleCategoryChange() {
          document.querySelectorAll('.dynamic-field').forEach(el => el.style.display = 'none');
          const cat = document.getElementById('category').value;
          if(cat) document.getElementById(cat.substring(0,2)+'-fields').style.display = 'block';
        }

        // 🚀 මෙන්න FormData එකෙන් කෙලින්ම ෆොටෝ එක සර්වර් යවන ජාවාස්ක්‍රිප්ට් කෑල්ල
        document.getElementById('addListingForm').addEventListener('submit', async (e) => {
          e.preventDefault();
          
          const submitBtn = document.getElementById('submitBtn');
          const spinner = document.getElementById('btnSpinner');
          const btnText = document.getElementById('btnText');
          submitBtn.disabled = true;
          spinner.style.display = 'block';
          btnText.innerText = "Uploading Image...";

          const formData = new FormData();
          formData.append('category', document.getElementById('category').value);
          formData.append('title', document.getElementById('title').value);
          formData.append('price', document.getElementById('price').value);
          formData.append('image', document.getElementById('image').files[0]); // ෆයිල් එක දානවා
          formData.append('description', document.getElementById('description').value);
          
          const cat = document.getElementById('category').value;
          if(cat === 'freefire') {
            formData.append('level', document.getElementById('level').value);
            formData.append('skins', document.getElementById('skins').value);
          } else if(cat === 'youtube') {
            formData.append('subscribers', document.getElementById('subscribers').value);
          } else if(cat === 'tiktok') {
            formData.append('followers', document.getElementById('followers').value);
          } else if(cat === 'diamonds') {
            formData.append('diamondCount', document.getElementById('diamondCount').value);
          }

          try {
            const res = await fetch('https://admi-bwd8.onrender.com/api/admin/add', {
              method: 'POST',
              body: formData
            });
            const data = await res.json();
            if(data.success) {
              alert("Product & Image Published successfully!");
              document.getElementById('addListingForm').reset();
              handleCategoryChange();
            } else {
              alert("Error: " + data.message);
            }
          } catch(err) {
            alert("Upload failed!");
          } finally {
            submitBtn.disabled = false;
            spinner.style.display = 'none';
            btnText.innerText = "Publish Live";
            loadItems();
          }
        });

        async function loadItems() {
          const res = await fetch('https://admi-bwd8.onrender.com/api/admin/items');
          const items = await res.json();
          const tbody = document.getElementById('admin-table');
          tbody.innerHTML = '';
          items.forEach(item => {
            const tr = document.createElement('tr');
            const statusBadge = item.status === 'available' ? '<span class="badge badge-available">Available</span>' : '<span class="badge badge-sold">Sold Out</span>';
            const actionBtn = item.status === 'available' 
              ? \`<button class="btn-sold" onclick="updateStatus('\${item._id}', 'sold')">Mark Sold</button>\`
              : \`<button class="btn-avail" onclick="updateStatus('\${item._id}', 'available')">Mark Available</button>\`;

            tr.innerHTML = \`
              <td><img src="\${item.image}" style="width:50px; height:50px; object-fit:cover; border-radius:6px;"></td>
              <td><strong>\${item.title}</strong></td>
              <td style="text-transform:uppercase; font-size:12px;">\${item.category}</td>
              <td>LKR \${item.price.toLocaleString()}</td>
              <td>\${statusBadge}</td>
              <td>\${actionBtn} <button onclick="deleteItem('\${item._id}')" style="background:#6c757d; border:none; color:white; padding:5px 10px; border-radius:4px; cursor:pointer; margin-left:5px;">Delete</button></td>
            \`;
            tbody.appendChild(tr);
          });
        }

        async function updateStatus(id, stat) {
          await fetch('/api/admin/status/'+id, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: stat })
          });
          loadItems();
        }

        async function deleteItem(id) {
          if(confirm("Are you sure you want to delete this?")) {
            await fetch('/api/admin/delete/'+id, { method: 'DELETE' });
            loadItems();
          }
        }
      </script>
    </body>
    </html>
  `);
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`Admin Server running on port ${PORT}`));
