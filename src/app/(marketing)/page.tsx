"use client";

import HeroSection from "@/components/marketing/HeroSection";
import StickyModelSection from "@/components/marketing/StickyModelSection";
import ToolSection from "@/components/marketing/ToolSection";
import EditorSection from "@/components/marketing/EditorSection";
import WorkflowTransition from "@/components/marketing/WorkflowTransition";
import ExploreWorkflows from "@/components/marketing/ExploreWorkflows";
import Footer from "@/components/marketing/Footer";

export default function LandingPage() {
	return (
		<div className=" font-sans">
			<HeroSection />
			<StickyModelSection />
			<ToolSection />

			<EditorSection />
			<WorkflowTransition />
			<ExploreWorkflows />
			<Footer />
		</div>
	);
}
