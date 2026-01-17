import Navbar from "@/components/marketing/Navbar";
import LandingPage from "@/app/(marketing)/page";
import SmoothScroll from "@/components/SmoothScroll";

export default function Home() {
	return (
		<SmoothScroll>
			<div className="min-h-screen flex flex-col bg-[#FBFBFB] selection:bg-yellow-200">
				<Navbar />
				<main className="flex-1">
					<LandingPage />
				</main>
			</div>
		</SmoothScroll>
	);
}
