// components/footer.tsx

const Footer = () => {
  return (
    <footer className="py-4 px-6 border-t mt-auto">
      <div className="container mx-auto text-center text-sm text-gray-500">
        <p>&copy; {new Date().getFullYear()} Dropln. All rights reserved.</p>
        {/* You can add more links or information here if needed */}
      </div>
    </footer>
  );
};

export default Footer;
