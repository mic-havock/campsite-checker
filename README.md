# Campsite Reservation System

A React-based application for managing campsite reservations with an interactive calendar interface using AG Grid.

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

- Node.js (v14.0.0 or higher)
- npm (v6.0.0 or higher)

## Installation

1. Clone the repository:

```
git clone https://github.com/mkovach302/campsite-reservation-system.git
```

2. Navigate to the project directory:

```
cd campsite-reservation-system
```

3. Install dependencies:

```
npm install
```

4. Start the development server:

```
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

## Configuration

### AG Grid Setup

The application uses AG Grid with the following modules:

- ClientSideRowModelModule
- ColumnAutoSizeModule
- CellStyleModule

### Theme Configuration

Uses AG Grid's Alpine theme with legacy support:

```javascript
theme = "legacy";
```

## Development Notes

- Uses Cursor's Integrated Powershell with Administrator rights for development
- Chrome browser recommended for optimal development experience
- Implements strict TypeScript notation
- Follows specific string handling conventions (double quotes, template literals)

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## Code Standards

- Use TypeScript strict mode
- Avoid 'any' type usage
- Avoid non-null assertion operator
- Use double quotes for strings
- Implement proper error checking
- Include JSDoc comments for functions
- Use template literals for string interpolation

## Contact

Your Name - [mkovach302@gmail.com]

Project Link: [https://github.com/mkovach302/campsite-reservation-system]

## Acknowledgments

- AG Grid Documentation
- React Documentation
- TypeScript Documentation
