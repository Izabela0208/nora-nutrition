import dynamic from "next/dynamic";

// Disable SSR for the app — recharts requires the browser DOM
const NutritionApp = dynamic(() => import("../components/NutritionApp"), {
  ssr: false,
});

export default function Home() {
  return <NutritionApp />;
}
