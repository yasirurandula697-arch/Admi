const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');

const app = express();
app.use(express.json());
app.use(cors());

// ⚠️ ඔයාගේ MongoDB සිරාම Link එක මෙතනට දාන්න
const MONGO_URI = "ඔයාගේ_MONGO_DB_LINK_EKA_METHANATA_DANNA"; 

// 2. ⚠️ Cloudinary Dashboard එකෙන් ගත්ත විස්තර මෙතනට දාන්න
cloudinary.config({
  cloud_name: 'dzjqsj65m',
  api_key: '575893172188643',
  api_secret: 'BY3YItebFWCBWWk0z6b3XuJRzyM' // ඔය උඹ එවපු කෝඩ් එක මෙතනට
});

mongoose.connect(MONGO_URI)
  .then(() => console.log('Admin Panel connected to Database!'))
  .catch(err => console.error('Database connection error:', err));

// Database Schema (Main සයිට් එකේ එකමයි)
const itemSchema = new mongoose.Schema({
  category: { type: String, required: true },
  title: { type: String, required: true },
  price: { type: Number, required: true },
  image: { type: String, required: true },
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

// 1. බඩු ටික Table එකට ගන්න
app.get('/api/admin/items', async (req, res) => {
  try {
    const items = await Item.find().sort({ createdAt: -1 });
    res.json(items);
  } catch (err) { res.status(500).json(err); }
});

// 2. අලුත් බඩු ඇතුලත් කරන්න
app.post('/api/admin/add', async (req, res) => {
  try {
    const newItem = new Item(req.body);
    await newItem.save();
    res.status(201).json({ success: true });
  } catch (err) { res.status(400).json({ success: false, message: err.message }); }
});

// 3. Status මාරු කරන්න (Available / Sold)
app.put('/api/admin/status/:id', async (req, res) => {
  try {
    await Item.findByIdAndUpdate(req.params.id, { status: req.body.status });
    res.json({ success: true });
  } catch (err) { res.status(500).json({ success: false }); }
});

// 4. Delete කරන්න
app.delete('/api/admin/delete/:id', async (req, res) => {
  try {
    await Item.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ success: false }); }
});


// ---- ADMIN PANEL UI (HTML & CSS) ----
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
        <form id="addListingForm">
          <div class="form-group"><label>Category</label>
            <select id="category" onchange="handleCategoryChange()" required>
              <option value="freefire">Free Fire Accounts</option>
              <option value="youtube">YouTube Channels</option>
              <option value="tiktok">TikTok Profiles</option>
              <option value="diamonds">💎 Diamond Packs</option>
            </select>
          </div>
          <div class="form-group"><label>Title</label><input type="text" id="title" required></div>
          <div class="form-group"><label>Price (LKR)</label><input type="number" id="price" required></div>
          <div class="form-group"><label>Image URL</label><input type="text" id="image" required></div>

          <div id="ff-fields" class="dynamic-field" style="display:block;">
            <div class="form-group"><label>Level</label><input type="number" id="level"></div>
            <div class="form-group"><label>Evo Skins</label><input type="text" id="skins"></div>
          </div>
          <div id="yt-fields" class="dynamic-field"><div class="form-group"><label>Subscribers</label><input type="text" id="subscribers"></div></div>
          <div id="tt-fields" class="dynamic-field"><div class="form-group"><label>Followers</label><input type="text" id="followers"></div></div>
          <div id="dia-fields" class="dynamic-field"><div class="form-group"><label>Diamond Count</label><input type="number" id="diamondCount"></div></div>

          <div class="form-group"><label>Description</label><textarea id="description" rows="2"></textarea></div>
          <button type="submit">Publish Live</button>
        </form>
      </div>

      <!-- Live Manage Table -->
      <h3 style="margin-bottom:15px;">Live Listings</h3>
      <table>
        <thead>
          <tr><th>Title</th><th>Category</th><th>Price</th><th>Status</th><th>Actions</th></tr>
        </thead>
        <tbody id="admin-table"></tbody>
      </table>

      <script>
        // 🔐 මෙතනට ඔයාට කැමති රහස් Password එකක් දෙන්න (දැනට 1234 තියෙන්නේ)
        function checkPassword() {
          const pass = document.getElementById('adminPass').value;
          if(pass === "1234") { 
            document.getElementById('loginScreen').style.display = 'none';
            loadItems();
          } else { alert("Wrong Password! Try again."); }
        }

        function handleCategoryChange() {
          document.querySelectorAll('.dynamic-field').forEach(el => el.style.display = 'none');
          const cat = document.getElementById('category').value;
          if(cat) document.getElementById(cat.substring(0,2)+'-fields').style.display = 'block';
        }

        document.getElementById('addListingForm').addEventListener('submit', async (e) => {
          e.preventDefault();
          const payload = {
            category: document.getElementById('category').value,
            title: document.getElementById('title').value,
            price: Number(document.getElementById('price').value),
            image: document.getElementById('image').value,
            description: document.getElementById('description').value,
            level: Number(document.getElementById('level').value) || undefined,
            skins: document.getElementById('skins').value || undefined,
            subscribers: document.getElementById('subscribers').value || undefined,
            followers: document.getElementById('followers').value || undefined,
            diamondCount: Number(document.getElementById('diamondCount').value) || undefined,
          };

          await fetch('/api/admin/add', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
          });
          document.getElementById('addListingForm').reset();
          loadItems();
        });

        async function loadItems() {
          const res = await fetch('/api/admin/items');
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
              <td><strong>\${item.title}</strong></td>
              <td style="text-transform:uppercase;">\${item.category}</td>
              <td>LKR \${item.price.toLocaleString()}</td>
              <td>\${statusBadge}</td>
              <td>\${actionBtn} <button onclick="deleteItem('\${item._id}')" style="background:#6c757d; border:none; color:white; padding:5px 10px; border-radius:4px; cursor:pointer;">Delete</button></td>
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
          if(confirm("Delete this?")) {
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
