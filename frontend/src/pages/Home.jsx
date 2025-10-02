
export default function Home() {
  return (
    <div className="max-w-4xl mx-auto p-4 text-center">
      <h1 className="text-2xl font-bold text-[#1e3a8a] mb-4">Welcome!</h1>
      < img 
        src="/group.jpg" 
        alt="Welcome banner" 
        className="mx-auto rounded-lg shadow-md mb-4"
      />
      <p className="text-gray-700">
        Use the navigation above to manage your leaves, view assigned shifts, and submit swap requests.
      </p >
    </div>
  );
}
