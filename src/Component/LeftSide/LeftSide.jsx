import React from 'react';

const LeftSide = () => {
    return (
        <div className="w-full bg-white p-4 rounded-lg shadow">
            <div className="flex items-center mb-4">
                <img src="https://via.placeholder.com/80?text=Demo+Icon" alt="Demo Icon" className="rounded-full mr-3" />
                <div>
                    <h2 className="text-lg font-semibold text-gray-900">Sam Lanson</h2>
                    <p className="text-sm text-gray-600">Web Developer at StackBros</p>
                    <p className="text-sm text-gray-500 italic">I'd love to change the world, but they won't give me the source code.</p>
                </div>
            </div>
            <div className="flex justify-around text-center mb-6">
                <div>
                    <p className="text-sm text-gray-600">Post</p>
                    <p className="text-lg font-medium text-gray-900">256</p>
                </div>
                <div>
                    <p className="text-sm text-gray-600">Followers</p>
                    <p className="text-lg font-medium text-gray-900">2.5K</p>
                </div>
                <div>
                    <p className="text-sm text-gray-600">Following</p>
                    <p className="text-lg font-medium text-gray-900">365</p>
                </div>
            </div>
            <ul className="space-y-4 mb-6">
                <li className="flex items-center text-sm text-gray-900">
                    <span className="mr-2">🏠</span> Feed
                </li>
                <li className="flex items-center text-sm text-gray-900">
                    <span className="mr-2">👤</span> Connections
                </li>
                <li className="flex items-center text-sm text-gray-900">
                    <span className="mr-2">🌐</span> Latest News
                </li>
                <li className="flex items-center text-sm text-gray-900">
                    <span className="mr-2">📅</span> Events
                </li>
                <li className="flex items-center text-sm text-gray-900">
                    <span className="mr-2">💬</span> Groups
                </li>
                <li className="flex items-center text-sm text-gray-900">
                    <span className="mr-2">🔔</span> Notifications
                </li>
                <li className="flex items-center text-sm text-gray-900">
                    <span className="mr-2">⚙️</span> Settings
                </li>
            </ul>
            <button className="w-full text-blue-500 text-sm font-medium bg-blue-50 py-2 rounded mb-4">View Profile</button>
            <div className="text-xs text-gray-500 space-x-2">
                <a href="#" className="hover:underline">About</a>
                <a href="#" className="hover:underline">Settings</a>
                <a href="#" className="hover:underline">Support</a>
                <a href="#" className="hover:underline">Docs</a>
                <br />
                <a href="#" className="hover:underline">Help</a>
                <a href="#" className="hover:underline">Privacy & terms</a>
            </div>
            <p className="text-xs text-gray-500 mt-2">©2025</p>
        </div>
    );
};

export default LeftSide;