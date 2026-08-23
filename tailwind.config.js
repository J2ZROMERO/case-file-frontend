/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#eef8f6",
          100: "#d4eee9",
          500: "#1c8f84",
          600: "#14736c",
          700: "#105d58"
        },
        ink: "#172026",
        muted: "#65747d",
        surface: "#f6f8f9"
      },
      boxShadow: {
        soft: "0 10px 30px rgba(23, 32, 38, 0.08)"
      }
    }
  },
  plugins: [],
};

