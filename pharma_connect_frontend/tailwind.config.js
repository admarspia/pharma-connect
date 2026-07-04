/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      opacity: {
        8: "0.08",
        15: "0.15",
      },
      colors: {
        cream: "#FAF7F2",
        ink: "#14201F",
        teal: {
          50: "#EAF3F2",
          100: "#CFE3E1",
          300: "#6FA9A6",
          600: "#157A79",
          700: "#0F5257",
          900: "#0B3B3C",
        },
        amber: {
          50: "#FCF3E3",
          200: "#F2CE8F",
          400: "#EBB65B",
          500: "#E8A33D",
          600: "#C97F1F",
        },
        clay: {
          500: "#C2542F",
          600: "#A5431F",
        },
        sage: {
          500: "#5E8C61",
          600: "#456B48",
        },
      },
      fontFamily: {
        display: ["var(--font-display)", "serif"],
        sans: ["var(--font-sans)", "var(--font-ethiopic)", "sans-serif"],
      },
      borderRadius: {
        card: "0.875rem",
      },
      boxShadow: {
        card: "0 1px 2px rgba(11,59,60,0.06), 0 8px 24px -12px rgba(11,59,60,0.18)",
      },
    },
  },
  plugins: [],
};
