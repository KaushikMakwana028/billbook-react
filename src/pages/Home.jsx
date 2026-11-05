import { Link, useLocation } from "react-router-dom";
import { FaReact, FaCheckCircle } from "react-icons/fa";
import { FiNavigation } from "react-icons/fi";
import { SiTailwindcss } from "react-icons/si";

const Home = () => {
  const location = useLocation();

  const checks = [
    {
      name: "Tailwind CSS",
      icon: <SiTailwindcss className="text-3xl text-cyan-500" />,
      text: "Styles are applied (colors, spacing, shadow)",
    },
    {
      name: "React Icons",
      icon: <FaReact className="animate-spin text-3xl text-sky-500" />,
      text: "Icons are rendering (this one is spinning)",
    },
    {
      name: "React Router DOM",
      icon: <FiNavigation className="text-3xl text-indigo-500" />,
      text: `Current route: ${location.pathname}`,
    },
  ];

  return (
    <div className="mx-auto max-w-xl space-y-4">
      <h1 className="text-3xl font-bold text-indigo-600">Setup Check</h1>

      {checks.map((item) => (
        <div
          key={item.name}
          className="flex items-center gap-4 rounded-xl bg-white p-4 shadow"
        >
          {item.icon}
          <div className="flex-1">
            <p className="font-semibold text-gray-800">{item.name}</p>
            <p className="text-sm text-gray-500">{item.text}</p>
          </div>
          <FaCheckCircle className="text-2xl text-green-500" />
        </div>
      ))}

      <Link
        to="/test-404"
        className="inline-block rounded-lg bg-indigo-600 px-5 py-2 text-white hover:bg-indigo-700"
      >
        Test Router (go to unknown page)
      </Link>
    </div>
  );
};

export default Home;
