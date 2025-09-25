import React from 'react';
import { useNavigate } from 'react-router';

const About = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 py-12 px-4 sm:px-6 lg:px-8">
      <style>
        {`
          @keyframes fadeIn {
            0% { opacity: 0; transform: translateY(20px); }
            100% { opacity: 1; transform: translateY(0); }
          }
          .fade-in {
            animation: fadeIn 0.8s ease-out;
          }
          .fade-in-delay-1 { animation-delay: 0.2s; }
          .fade-in-delay-2 { animation-delay: 0.4s; }
          .fade-in-delay-3 { animation-delay: 0.6s; }
          .fade-in-delay-4 { animation-delay: 0.8s; }
          .fade-in-delay-5 { animation-delay: 1.0s; }
          .fade-in-delay-6 { animation-delay: 1.2s; }
          .hover-lift {
            transition: transform 0.3s ease, box-shadow 0.3s ease;
          }
          .hover-lift:hover {
            transform: translateY(-8px);
            box-shadow: 0 12px 24px rgba(0, 0, 0, 0.1);
          }
        `}
      </style>

      {/* Header Section */}
      <div className="max-w-5xl mx-auto text-center fade-in">
        <h1 className="text-4xl sm:text-6xl font-extrabold text-gray-900 mb-6 leading-tight">
          About Us
        </h1>
        <p className="text-lg sm:text-2xl text-gray-600 mb-12 max-w-3xl mx-auto leading-relaxed">
          Discover our journey, mission, and the passionate team behind our innovative platform. We're dedicated to creating meaningful connections and fostering creativity in every interaction.
        </p>
      </div>

      {/* Mission Section */}
      <div className="max-w-5xl mx-auto mt-16 bg-white rounded-2xl shadow-xl p-8 sm:p-12 border border-purple-100/50 fade-in fade-in-delay-1 hover-lift">
        <h2 className="text-3xl sm:text-4xl font-bold text-gray-800 mb-6 text-center">
          Our Mission
        </h2>
        <p className="text-gray-600 text-base sm:text-lg leading-relaxed mb-6">
          At our core, we aim to build a vibrant online community where individuals from diverse backgrounds can share ideas, collaborate on projects, and inspire one another. Our platform is designed to empower users to express themselves freely, learn from others, and contribute to a positive digital ecosystem.
        </p>
        <p className="text-gray-600 text-base sm:text-lg leading-relaxed">
          We believe that true innovation comes from open dialogue and collective effort. That's why we've created a space that's not just about posting content, but about building lasting relationships and driving real-world impact through digital connections.
        </p>
      </div>

      {/* Values/Features Section */}
      <div className="max-w-5xl mx-auto mt-16 grid grid-cols-1 md:grid-cols-3 gap-8 fade-in fade-in-delay-2">
        <div className="bg-white rounded-2xl shadow-md p-8 text-center border border-purple-100/50 hover-lift">
          <svg className="w-16 h-16 mx-auto mb-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path>
          </svg>
          <h3 className="text-2xl font-semibold text-gray-800 mb-4">Community First</h3>
          <p className="text-gray-600 text-base leading-relaxed">
            We prioritize creating inclusive spaces where every voice is heard. Our community guidelines ensure respectful interactions, fostering an environment of trust and mutual support for all members.
          </p>
        </div>
        <div className="bg-white rounded-2xl shadow-md p-8 text-center border border-purple-100/50 hover-lift">
          <svg className="w-16 h-16 mx-auto mb-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h7"></path>
          </svg>
          <h3 className="text-2xl font-semibold text-gray-800 mb-4">Seamless Collaboration</h3>
          <p className="text-gray-600 text-base leading-relaxed">
            Our tools enable effortless collaboration, from real-time discussions to shared projects. Whether you're working on a small idea or a large initiative, our platform provides the resources you need to succeed together.
          </p>
        </div>
        <div className="bg-white rounded-2xl shadow-md p-8 text-center border border-purple-100/50 hover-lift">
          <svg className="w-16 h-16 mx-auto mb-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"></path>
          </svg>
          <h3 className="text-2xl font-semibold text-gray-800 mb-4">Foster Innovation</h3>
          <p className="text-gray-600 text-base leading-relaxed">
            We encourage creative thinking and problem-solving through diverse perspectives. Our features support brainstorming, feedback loops, and knowledge sharing to help turn innovative ideas into reality.
          </p>
        </div>
      </div>

      {/* Our Story Section */}
      <div className="max-w-5xl mx-auto mt-16 bg-white rounded-2xl shadow-xl p-8 sm:p-12 border border-purple-100/50 fade-in fade-in-delay-3 hover-lift">
        <h2 className="text-3xl sm:text-4xl font-bold text-gray-800 mb-6 text-center">
          Our Story
        </h2>
        <p className="text-gray-600 text-base sm:text-lg leading-relaxed mb-6">
          Founded in 2020, our platform started as a small community forum for tech enthusiasts. Over the years, we've grown into a global network of creators, professionals, and hobbyists united by a passion for knowledge sharing and collaboration.
        </p>
        <p className="text-gray-600 text-base sm:text-lg leading-relaxed mb-6">
          What began with simple text posts has evolved into a comprehensive platform featuring multimedia content, real-time chat, event hosting, and AI-powered recommendations. Our commitment to user privacy and positive interactions has been key to our success.
        </p>
        <p className="text-gray-600 text-base sm:text-lg leading-relaxed">
          Today, we serve millions of users worldwide, facilitating countless collaborations and innovations. We're constantly evolving, incorporating user feedback to make our platform even better for tomorrow's ideas.
        </p>
      </div>

      {/* Team Section */}
      <div className="max-w-5xl mx-auto mt-16 fade-in fade-in-delay-4">
        <h2 className="text-3xl sm:text-4xl font-bold text-gray-800 mb-8 text-center">
          Meet Our Team
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-white rounded-2xl shadow-md p-6 text-center border border-purple-100/50 hover-lift">
            <img
              src="https://placehold.co/150x150?text=Jane"
              alt="Jane Doe"
              className="w-32 h-32 mx-auto rounded-full object-cover mb-4 shadow-md"
            />
            <h3 className="text-xl font-semibold text-gray-800 mb-2">Jane Doe</h3>
            <p className="text-indigo-600 font-medium mb-2">CEO & Founder</p>
            <p className="text-gray-600 text-sm leading-relaxed">
              Visionary leader with 15 years in tech, passionate about community building and digital innovation.
            </p>
          </div>
          <div className="bg-white rounded-2xl shadow-md p-6 text-center border border-purple-100/50 hover-lift">
            <img
              src="https://placehold.co/150x150?text=John"
              alt="John Smith"
              className="w-32 h-32 mx-auto rounded-full object-cover mb-4 shadow-md"
            />
            <h3 className="text-xl font-semibold text-gray-800 mb-2">John Smith</h3>
            <p className="text-indigo-600 font-medium mb-2">CTO</p>
            <p className="text-gray-600 text-sm leading-relaxed">
              Tech wizard specializing in scalable web applications and AI-driven features for enhanced user experiences.
            </p>
          </div>
          <div className="bg-white rounded-2xl shadow-md p-6 text-center border border-purple-100/50 hover-lift">
            <img
              src="https://placehold.co/150x150?text=Emily"
              alt="Emily Johnson"
              className="w-32 h-32 mx-auto rounded-full object-cover mb-4 shadow-md"
            />
            <h3 className="text-xl font-semibold text-gray-800 mb-2">Emily Johnson</h3>
            <p className="text-indigo-600 font-medium mb-2">Community Manager</p>
            <p className="text-gray-600 text-sm leading-relaxed">
              Expert in fostering online communities, with a focus on user engagement and positive interactions.
            </p>
          </div>
        </div>
      </div>

      {/* Testimonials Section */}
      <div className="max-w-5xl mx-auto mt-16 bg-white rounded-2xl shadow-xl p-8 sm:p-12 border border-purple-100/50 fade-in fade-in-delay-5 hover-lift">
        <h2 className="text-3xl sm:text-4xl font-bold text-gray-800 mb-8 text-center">
          What Our Users Say
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl p-6 shadow-md">
            <p className="text-gray-700 italic mb-4">"This platform has revolutionized how I connect with like-minded individuals. The community is incredibly supportive!"</p>
            <p className="text-right font-semibold text-gray-800">- Alex R., Content Creator</p>
          </div>
          <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl p-6 shadow-md">
            <p className="text-gray-700 italic mb-4">"The features are intuitive and powerful. I've collaborated on multiple projects that started right here."</p>
            <p className="text-right font-semibold text-gray-800">- Sarah L., Developer</p>
          </div>
          <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl p-6 shadow-md md:col-span-2">
            <p className="text-gray-700 italic mb-4">"An innovative space that truly fosters creativity and meaningful discussions. Highly recommended!"</p>
            <p className="text-right font-semibold text-gray-800">- Michael T., Entrepreneur</p>
          </div>
        </div>
      </div>

      {/* Call to Action */}
      <div className="max-w-5xl mx-auto mt-16 text-center fade-in fade-in-delay-6">
        <h2 className="text-3xl sm:text-4xl font-bold text-gray-800 mb-6">
          Ready to Join Our Community?
        </h2>
        <p className="text-gray-600 text-lg mb-8 max-w-3xl mx-auto">
          Sign up today to become part of our growing family. Whether you're here to learn, share, or collaborate, we have a place for you.
        </p>
        <div className="flex flex-col sm:flex-row justify-center gap-4">
          <button
            onClick={() => navigate('/join-us')}
            className="py-3 px-8 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold rounded-lg shadow-md hover:from-indigo-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition duration-300 hover-lift"
          >
            Join Us
          </button>
          <button
            onClick={() => navigate('/register')}
            className="py-3 px-8 bg-white text-indigo-600 font-semibold border-2 border-indigo-600 rounded-lg shadow-md hover:bg-indigo-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition duration-300 hover-lift"
          >
            Register
          </button>
        </div>
      </div>
    </div>
  );
};

export default About;