# PPP (Price per Pound) Invoice Wizard

A modern React-based towing billing application with full-stack PostgreSQL database integration for professional towing service invoice management.

## Features

- **Professional Invoice Generation**: Create detailed invoices with customizable pricing
- **Photo Management**: Upload and display job photos in invoices and PDFs
- **PDF Export**: Generate professional PDF invoices with embedded photos
- **Database Storage**: PostgreSQL database for persistent data storage
- **Service Management**: Customize towing service rates and pricing
- **Company Settings**: Configure company information and branding
- **Recent Jobs**: Quick access to previously created jobs
- **Responsive Design**: Modern, mobile-friendly interface

## Technology Stack

- **Frontend**: React 18, TypeScript, Tailwind CSS
- **Backend**: Express.js, Node.js
- **Database**: PostgreSQL with Drizzle ORM
- **Build Tool**: Vite
- **UI Components**: Shadcn/ui components
- **PDF Generation**: jsPDF with html2canvas
- **File Uploads**: Multer middleware

## Setup Instructions

### Prerequisites

- Node.js 18+ 
- PostgreSQL database
- npm or yarn package manager

### Installation

1. Clone the repository:
```bash
git clone <your-repo-url>
cd ppp-invoice-wizard
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
# Create .env file with your database connection
DATABASE_URL=postgresql://username:password@localhost:5432/database_name
```

4. Push database schema:
```bash
npm run db:push
```

5. Start the development server:
```bash
npm run dev
```

The application will be available at `http://localhost:5000`

## Usage

### Creating an Invoice

1. **Job Information**: Enter customer details, vehicle information, and problem description
2. **Select Services**: Choose from available towing services with customizable rates
3. **Upload Photos**: Add job photos that will appear in the invoice
4. **Generate Invoice**: View and export the completed invoice as PDF

### Managing Services

- Access the sidebar to modify service rates
- Add or remove towing services as needed
- Rates are automatically applied to new invoices

### Company Settings

- Configure company name and contact information
- Upload company logo for professional branding
- Settings apply to all generated invoices

## Database Schema

The application uses the following main tables:

- `jobs`: Store job information and customer details
- `towing_services`: Available services and their rates
- `invoice_services`: Services selected for each job
- `job_photos`: Photos associated with jobs
- `company_settings`: Company configuration

## API Endpoints

- `GET /api/jobs/recent` - Get recent jobs
- `POST /api/jobs` - Create new job
- `GET /api/services` - Get towing services
- `PUT /api/services/:id` - Update service rate
- `POST /api/jobs/:id/photos` - Upload job photos
- `GET /api/company` - Get company settings

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For issues or questions, please create an issue in the GitHub repository.