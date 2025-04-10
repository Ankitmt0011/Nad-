import { useState } from "react";

export default function Home() { const [activeTab, setActiveTab] = useState("wallet");

return ( <div className="h-screen bg-black text-white flex flex-col"> {/* Main Content */} <div className="flex-1"> {activeTab === "wallet" && ( <div className="flex items-center justify-center h-full"> <p className="text-sky-400 text-xl">Coming soon...</p> </div> )} {activeTab === "tasks" && ( <div className="p-4"> <h2 className="text-white text-xl mb-4">Tasks</h2> <ul className="list-disc pl-5 space-y-2"> <li> <a href="#" className="text-blue-500 underline"> Join Telegram </a> </li> <li> <a href="#" className="text-blue-500 underline"> Follow on Twitter </a> </li> <li> <a href="#" className="text-blue-500 underline"> Retweet </a> </li> </ul> </div> )} </div>

{/* Bottom Tabs */}
  <div className="flex justify-around bg-black border-t border-gray-700 py-2">
    <button
      onClick={() => setActiveTab("wallet")}
      className={`text-sm ${activeTab === "wallet" ? "text-sky-400" : "text-white"}`}
    >
      Wallet
    </button>
    <button
      onClick={() => setActiveTab("tasks")}
      className={`text-sm ${activeTab === "tasks" ? "text-sky-400" : "text-white"}`}
    >
      Tasks
    </button>
  </div>
</div>

); }

