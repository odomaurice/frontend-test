"use client";
import { useState } from "react";
import { X } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";


const navLinks = [
  { name: "Courses", href: "/courses" },
  { name: "Faculties", href: "/faculties" },
  { name: "Students", href: "/students" },
  { name: "Jobs", href: "#" },
  { name: "FAQs", href: "/faqs" },
];

const Header = () => {
  const [menu, setMenu] = useState(false);
  const pathname = usePathname();

  const toggleMenu = () => setMenu((prev) => !prev);
  const closeMenu = () => setMenu(false);

  return (
    <header className="bg-[#f6f4fe] h-[75px] text-black sticky sm:top-0 font-header pt-4 font-semibold z-50">
      {/* DESKTOP */}
      <div className="hidden sm:flex justify-between items-center px-2 md:px-4 h-full">
        <Link href="/">
          <Image
            src="/TechUni Logo@300x.png"
            alt="TechUni Logo"
            width={300}
            height={300}
            className="w-[150px]"
          />
        </Link>
        <div className=" flex h-full  ">
        <nav className="flex gap-4  pt-[20px] xl:gap-[50px] text-[14px]">
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.name}
                href={link.href}
                className={`px-8 transition-all ${
                  isActive
                    ? "font-bold border-violet-800  border-b-2 bg-slate-100/20"
                    : "font-semibold"
                }`}
              >
                {link.name}
              </Link>
            );
          })}
        </nav>
        </div>

        <Link
           href="/register"
         
          className="bg-violet-700 rounded-full mb-2 hover:bg-violet-600 text-white text-[14px] p-6 w-40"
        >
            Get Started
        
        </Link>
      </div>

      {/* MOBILE */}
      <div
        className={`sm:hidden fixed top-0 w-full z-[999] py-6 ${
          menu ? "bg-white text-black" : "bg-white"
        }`}
      >
        <div className="flex justify-between px-4">
          <Link href="/">
            <Image
              src="/TechUni Logo@300x.png"
              alt="TechUni Logo"
              width={300}
              height={300}
              className="w-[150px]"
            />
          </Link>

          <button
            onClick={toggleMenu}
            aria-expanded={menu}
            className="focus:outline-none"
          >
            {menu ? (
              <X className="text-black w-6 h-6" />
            ) : (
              <Image
                src="/menu.svg"
                alt="Menu"
                width={30}
                height={30}
                className="w-[30px]"
              />
            )}
          </button>
        </div>

        {menu && (
          <nav
            className="my-8 animate-in slide-in-from-right"
            aria-hidden={!menu}
          >
            <div className="flex flex-col gap-8 mt-8 px-4">
              {navLinks.map((link) => {
                const isActive = pathname === link.href;
                return (
                  <Link
                    key={link.name}
                    href={link.href}
                    onClick={closeMenu}
                    className={`text-[16px] ${
                      isActive ? "font-bold text-violet-700" : "font-semibold"
                    }`}
                  >
                    {link.name}
                  </Link>
                );
              })}
              <Link
              href="/register"
                
                className="bg-violet-700 rounded-full hover:bg-violet-600 text-white text-[14px] px-3 w-full py-2"
              >
                Get Started
              </Link>
            </div>
          </nav>
        )}
      </div>
    </header>
  );
};

export default Header;
