# Kampscout

A modern web application for finding and managing campsite reservations, featuring an interactive calendar interface and real-time availability tracking.

## Live Application

Visit [kampscout.com](https://kampscout.com) to use the application.

## Features

- Interactive grid-based reservation system
- Visual representation of campsite availability
- Date-based filtering and navigation
- Real-time availability updates
- Responsive design for various screen sizes

## Technologies Used

- React.js
- AG Grid (for data grid functionality)
- SCSS (for styling)
- TypeScript
- Vite (build tool)

## Prerequisites

Before you begin, ensure you have the following installed:

- Node.js (v18.0.0 or higher)
- npm (v8.0.0 or higher)

## Installation

1. Clone the repository:

```bash
git clone https://github.com/mkovach302/campsite-reservation-system.git
```

2. Navigate to the project directory:

```bash
cd campsite-reservation-system
```

3. Install dependencies:

```bash
npm install
```

4. Start the development server:

```bash
npm run dev
```

## Key Components

### CampgroundAvailability

The main component that handles the reservation grid display and interactions:

- Displays campsite availability in a grid format
- Uses AG Grid for data presentation
- Implements interactive cell rendering for availability status
- Handles user interactions for reservation management

## Grid Features

- **Column Headers**: Center-aligned date displays
- **Cell Styling**:
  - Available slots: Green background with "A"
  - Unavailable slots: Red background with "X"
- **Interactive Elements**:
  - Hover effects on cells
  - Click handling for unavailable dates
- **Fixed Layout**:
  - Campsite column pinned to left
  - Date columns with uniform width

## Development Notes

- Uses Cursor's Integrated Powershell with Administrator rights for development
- Chrome browser recommended for optimal development experience
- Implements strict TypeScript notation
- Follows specific string handling conventions (double quotes, template literals)

## Code Standards

- Use TypeScript strict mode
- Avoid 'any' type usage
- Avoid non-null assertion operator
- Use double quotes for strings
- Implement proper error checking
- Include JSDoc comments for functions
- Use template literals for string interpolation

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## Contact

Michael Kovach - [mkovach302@gmail.com]

Project Link: [https://github.com/mkovach302/campsite-reservation-system]
