const Index = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
      <header className="container mx-auto px-6 py-8">
        <nav className="flex items-center justify-between">
          <h2 className="text-2xl font-bold tracking-tight">FitCoach</h2>
          <a href="#contact" className="rounded-full bg-white/10 px-6 py-2 text-sm font-medium backdrop-blur-sm hover:bg-white/20 transition">
            Contact
          </a>
        </nav>
      </header>

      <main className="container mx-auto px-6 py-20">
        <section className="text-center max-w-3xl mx-auto">
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6 bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
            Transform Your Fitness Journey
          </h1>
          <p className="text-xl text-slate-300 mb-10 max-w-2xl mx-auto">
            Professional coaching and personalized training programs to help you achieve your health and fitness goals.
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <button className="bg-white text-slate-900 px-8 py-4 rounded-full font-semibold hover:bg-slate-100 transition">
              Get Started
            </button>
            <button className="border border-white/30 px-8 py-4 rounded-full font-semibold hover:bg-white/10 transition">
              Learn More
            </button>
          </div>
        </section>

        <section className="grid md:grid-cols-3 gap-8 mt-32">
          {[
            { title: "Personal Training", desc: "One-on-one sessions tailored to your goals" },
            { title: "Nutrition Plans", desc: "Custom meal plans for optimal results" },
            { title: "Progress Tracking", desc: "Monitor your journey every step of the way" },
          ].map((item) => (
            <div key={item.title} className="bg-white/5 backdrop-blur-sm rounded-2xl p-8 border border-white/10">
              <h3 className="text-xl font-semibold mb-3">{item.title}</h3>
              <p className="text-slate-400">{item.desc}</p>
            </div>
          ))}
        </section>
      </main>

      <footer id="contact" className="container mx-auto px-6 py-12 border-t border-white/10 mt-20">
        <p className="text-center text-slate-400">© 2026 FitCoach. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default Index;
