"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { Loader, Check, X } from "lucide-react";

interface MahramNotificationProps {
  notificationId: string;
  mahramId: string;
  requesterName: string;
  requesterUsername: string;
  requesterImage?: string;
  onUpdate?: () => void;
}

const relationTypes = [
  { id: 1, label: "Father" },
  { id: 2, label: "Mother" },
  { id: 3, label: "Brother" },
  { id: 4, label: "Sister" },
  { id: 5, label: "Son" },
  { id: 6, label: "Daughter" },
  { id: 7, label: "Grandfather" },
  { id: 8, label: "Grandmother" },
  { id: 9, label: "Grandson" },
  { id: 10, label: "Granddaughter" },
  { id: 11, label: "Uncle" },
  { id: 12, label: "Aunt" },
  { id: 13, label: "Nephew" },
  { id: 14, label: "Niece" },
  { id: 15, label: "Husband" },
  { id: 16, label: "Wife" },
];

export default function MahramNotification({
  notificationId,
  mahramId,
  requesterName,
  requesterUsername,
  requesterImage,
  onUpdate,
}: MahramNotificationProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [selectedRelation, setSelectedRelation] = useState<number | null>(null);
  const [showRelationDropdown, setShowRelationDropdown] = useState(false);
  const supabase = createClient();
  const router = useRouter();

  const handleApprove = async () => {
    if (!selectedRelation) {
      alert("Please select a mahram relation type");
      return;
    }

    setIsLoading(true);

    try {
      // Approve the mahram request
      const { data: approveData, error: approveError } = await supabase.rpc(
        "approve_mahram_request",
        {
          p_mahram_id: mahramId,
          p_relation_id: selectedRelation,
        }
      );

      if (approveError) {
        console.error("Approve error:", approveError);
        return;
      }

      // Mark notification as read
      await supabase
        .from("NOTIFICATION")
        .update({ is_read: true })
        .eq("notification_id", notificationId);

      // Refresh notifications
      onUpdate?.();
    } catch (err: any) {
      console.error("Error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleReject = async () => {
    setIsLoading(true);

    try {
      // Reject the mahram request
      const { error: rejectError } = await supabase.rpc(
        "reject_mahram_request",
        {
          p_mahram_id: mahramId,
        }
      );

      if (rejectError) {
        console.error("Reject error:", rejectError);
        return;
      }

      // Mark notification as read
      await supabase
        .from("NOTIFICATION")
        .update({ is_read: true })
        .eq("notification_id", notificationId);

      // Refresh notifications
      onUpdate?.();
    } catch (err: any) {
      console.error("Error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 border-l-4 border-purple-500 p-4 rounded-lg">
      {/* Header */}
      <div className="flex items-start gap-3">
        {/* Avatar */}
        <div className="flex-shrink-0">
          {requesterImage ? (
            <img
              src={requesterImage}
              alt={requesterName}
              className="w-10 h-10 rounded-full object-cover"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-400 to-blue-500 flex items-center justify-center text-white text-sm font-semibold">
              {requesterName?.charAt(0)?.toUpperCase()}
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold text-gray-900 dark:text-white">
                {requesterName}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                @{requesterUsername}
              </p>
              <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">
                sent a mahram request
              </p>
            </div>
          </div>

          {/* Relation Selection */}
          <div className="mt-4">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-2">
              How is {requesterName} related to you?
            </label>
            <div className="relative">
              <button
                onClick={() => setShowRelationDropdown(!showRelationDropdown)}
                className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-left text-gray-900 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
              >
                {selectedRelation
                  ? relationTypes.find((r) => r.id === selectedRelation)?.label
                  : "Select relation type..."}
              </button>

              {showRelationDropdown && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg z-10 max-h-48 overflow-y-auto mahram-scrollbar">
                  {relationTypes.map((relation) => (
                    <button
                      key={relation.id}
                      onClick={() => {
                        setSelectedRelation(relation.id);
                        setShowRelationDropdown(false);
                      }}
                      className="w-full text-left px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-600 text-gray-900 dark:text-gray-100 transition-colors"
                    >
                      {relation.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 mt-4">
            <button
              onClick={handleApprove}
              disabled={isLoading || !selectedRelation}
              className="flex-1 bg-green-500 hover:bg-green-600 disabled:bg-green-400 text-white font-semibold py-2 rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <Loader className="w-4 h-4 animate-spin" />
              ) : (
                <Check className="w-4 h-4" />
              )}
              Approve
            </button>

            <button
              onClick={handleReject}
              disabled={isLoading}
              className="flex-1 bg-red-500 hover:bg-red-600 disabled:bg-red-400 text-white font-semibold py-2 rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <Loader className="w-4 h-4 animate-spin" />
              ) : (
                <X className="w-4 h-4" />
              )}
              Reject
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
