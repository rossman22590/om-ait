"use client";

import React from 'react';
import Link from 'next/link';

const GithubButton = () => {
  return (
    <Link
      href="https://github.com/kortix-ai/"
      target="_blank"
      rel="noopener noreferrer"
      className="fixed right-4 bottom-4 z-50 flex items-center justify-center rounded-full bg-black dark:bg-white p-3 shadow-lg hover:shadow-xl transition-all duration-200"
      aria-label="View on GitHub"
    >
      <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="text-white dark:text-black"
      >
        <path
          d="M12 2C6.477 2 2 6.477 2 12C2 16.418 4.865 20.166 8.84 21.49C9.34 21.581 9.5 21.276 9.5 21.012C9.5 20.775 9.492 20.018 9.488 19.167C6.726 19.793 6.14 17.81 6.14 17.81C5.685 16.657 5.028 16.352 5.028 16.352C4.121 15.695 5.097 15.708 5.097 15.708C6.104 15.778 6.64 16.775 6.64 16.775C7.54 18.302 9.007 17.857 9.52 17.602C9.609 16.935 9.861 16.49 10.139 16.242C7.978 15.992 5.692 15.122 5.692 11.292C5.692 10.114 6.097 9.153 6.66 8.404C6.559 8.153 6.205 7.076 6.76 5.81C6.76 5.81 7.604 5.544 9.476 6.726C10.293 6.507 11.156 6.397 12.015 6.393C12.874 6.397 13.737 6.507 14.556 6.726C16.425 5.544 17.268 5.81 17.268 5.81C17.824 7.076 17.47 8.153 17.37 8.404C17.934 9.153 18.335 10.114 18.335 11.292C18.335 15.132 16.045 15.989 13.875 16.234C14.222 16.538 14.532 17.142 14.532 18.059C14.532 19.358 14.52 20.683 14.52 21.012C14.52 21.278 14.678 21.587 15.186 21.487C19.156 20.161 22.017 16.417 22.017 12C22.017 6.477 17.54 2 12.017 2H12Z"
          fill="currentColor"
        />
      </svg>
    </Link>
  );
};

export default GithubButton;
