"use client";

import Swal from "sweetalert2";

export async function confirmDelete(text = "You won't be able to revert this!"): Promise<boolean> {
  const result = await Swal.fire({
    title: "Are you sure?",
    text,
    icon: "warning",
    showCancelButton: true,
    confirmButtonColor: "#3085d6",
    cancelButtonColor: "#d33",
    confirmButtonText: "Yes, delete it!",
    cancelButtonText: "Cancel",
    reverseButtons: true,
  });
  return result.isConfirmed;
}

export async function showDeleted(text: string): Promise<void> {
  await Swal.fire({
    title: "Deleted!",
    text,
    icon: "success",
    confirmButtonColor: "#3085d6",
  });
}

export async function confirmClearBoard(projectCount: number): Promise<boolean> {
  const result = await Swal.fire({
    title: "Are you sure?",
    text: `This will permanently delete all ${projectCount} projects, logs, and chats.`,
    icon: "warning",
    input: "text",
    inputPlaceholder: "Type DELETE to confirm",
    showCancelButton: true,
    confirmButtonColor: "#3085d6",
    cancelButtonColor: "#d33",
    confirmButtonText: "Yes, clear the board!",
    cancelButtonText: "Cancel",
    reverseButtons: true,
    inputValidator: (value) => value === "DELETE" ? undefined : "Type DELETE to continue.",
  });
  return result.isConfirmed;
}