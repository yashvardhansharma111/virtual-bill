# Virtual Bill - Electrical Shop Billing System

A full-stack Next.js application for managing an Indian electrical shop billing system with Admin Panel and User Panel.

## 🚀 Features

### Admin Panel
- **Secure Login** - Hardcoded credentials (ID: `admin`, Password: `admin@123`)
- **Product Management** - Add, update, delete products
- **Image Upload** - Cloudinary integration for product images
- **Search & Filter** - Search products by name, brand, type
- **Sorting** - Sort by price, name, or type
- **Dashboard Stats** - View total products and categories

### User Panel
- **Product Browsing** - View all available products
- **Search & Filter** - Search and filter products by type
- **Shopping Cart** - Add products to cart with quantity management
- **Virtual Bill Generation** - Generate Indian-style shop receipts
- **PDF Download** - Download bills as PDF
- **Print Functionality** - Print bills directly

## 🛠️ Tech Stack

- **Next.js 16** (App Router)
- **TypeScript**
- **Tailwind CSS** (v4)
- **MongoDB** (Mongoose)
- **Cloudinary** (Image upload)
- **Axios** (HTTP client)
- **React Toastify** (Notifications)
- **jsPDF** (PDF generation)

## 📋 Prerequisites

- Node.js 18+ installed
- MongoDB database (local or cloud)
- Cloudinary account (for image uploads)

## 🔧 Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd virtualbill
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   
   Create a `.env.local` file in the root directory:
   ```env
   MONGODB_URI=mongodb://localhost:27017/virtualbill
   # Or use MongoDB Atlas:
   # MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/virtualbill

   CLOUDINARY_CLOUD_NAME=your_cloud_name
   CLOUDINARY_API_KEY=your_api_key
   CLOUDINARY_API_SECRET=your_api_secret
   ```

4. **Run the development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   - User Panel: http://localhost:3000
   - Admin Panel: http://localhost:3000/admin/login

## 🔐 Admin Credentials

- **ID:** `admin`
- **Password:** `admin@123`

## 📁 Project Structure

```
virtualbill/
├── app/
│   ├── api/
│   │   ├── admin/
│   │   │   ├── login/
│   │   │   ├── logout/
│   │   │   └── check/
│   │   └── products/
│   │       ├── [id]/
│   │       └── route.ts
│   ├── admin/
│   │   ├── dashboard/
│   │   ├── login/
│   │   └── products/
│   ├── layout.tsx
│   ├── page.tsx
│   └── globals.css
├── components/
│   ├── AdminSidebar.tsx
│   ├── Cart.tsx
│   ├── ProductCard.tsx
│   ├── ProductForm.tsx
│   ├── ToastProvider.tsx
│   └── VirtualBill.tsx
├── lib/
│   ├── cloudinary.ts
│   ├── mongodb.ts
│   └── utils.ts
├── models/
│   └── Product.ts
├── middleware.ts
└── README.md
```

## 🎨 UI Features

- **White + Purple Theme** - Modern, professional design
- **Responsive Layout** - Works on desktop, tablet, and mobile
- **Card-based Design** - Clean, modern card layouts
- **Loading States** - Skeleton loaders for better UX
- **Toast Notifications** - User-friendly feedback
- **Error Handling** - Comprehensive error messages

## 📝 API Endpoints

### Products
- `GET /api/products` - Get all products (with search, filter, sort)
- `POST /api/products` - Create a new product
- `GET /api/products/[id]` - Get a single product
- `PUT /api/products/[id]` - Update a product
- `DELETE /api/products/[id]` - Delete a product

### Admin
- `POST /api/admin/login` - Admin login
- `POST /api/admin/logout` - Admin logout
- `GET /api/admin/check` - Check admin authentication

## 🔒 Security

- Admin routes are protected by middleware
- Session-based authentication using cookies
- Admin panel only accessible via `/admin` routes

## 🚀 Deployment

### Build for production
```bash
npm run build
npm start
```

### Environment Variables for Production
Make sure to set all environment variables in your hosting platform:
- Vercel: Add in Project Settings → Environment Variables
- Other platforms: Follow their respective documentation

## 📱 Usage

### Admin Panel
1. Navigate to `/admin/login`
2. Login with credentials
3. Access dashboard to view stats
4. Go to Products to manage inventory
5. Add/Edit/Delete products with images

### User Panel
1. Browse products on the home page
2. Use search and filters to find products
3. Add products to cart
4. Adjust quantities in cart
5. Generate bill and download/print

## 🐛 Troubleshooting

### MongoDB Connection Issues
- Ensure MongoDB is running
- Check `MONGODB_URI` in `.env.local`
- Verify network connectivity for cloud databases

### Cloudinary Upload Issues
- Verify Cloudinary credentials
- Check image file size (should be reasonable)
- Ensure proper image format (jpg, png, etc.)

### Build Errors
- Clear `.next` folder: `rm -rf .next`
- Reinstall dependencies: `rm -rf node_modules && npm install`
- Check TypeScript errors: `npm run build`

## 📄 License

This project is open source and available under the MIT License.

## 👨‍💻 Development

### Adding New Product Types
Edit `components/ProductForm.tsx` and add new options to the type select dropdown.

### Customizing Bill Template
Edit `components/VirtualBill.tsx` to modify the bill layout and styling.

### Modifying Theme Colors
Update Tailwind classes and CSS variables in `app/globals.css`.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📞 Support

For issues and questions, please open an issue on the repository.

---

**Built with ❤️ using Next.js**
