import React, { useState } from "react";

interface ScheduleParameter {
  content: string;
  codeTime?: string;
  place?: string;
  participation?: string;
}

interface ScheduleBoss {
  username: string;
  position?: string;
  parameters?: ScheduleParameter[];
}

interface ScheduleBossesDisplayProps {
  scheduleBosses?: ScheduleBoss[];
}

const ScheduleBossesDisplay: React.FC<ScheduleBossesDisplayProps> = ({ scheduleBosses }) => {
  const [showAll, setShowAll] = useState(false);

  if (!scheduleBosses?.length) return null;

  const bossesToShow = showAll ? scheduleBosses : scheduleBosses.slice(0, 2);
  const hasMore = scheduleBosses.length > 2;

  const toggleShowAll = () => {
    setShowAll(!showAll);
  };

  return (
    <div className="text-sm font-normal text-gray-700">
      {bossesToShow?.map((boss, index) => (
        <div key={boss.username || index} className="mb-2 last:mb-0">
          <span className="font-semibold text-gray-800">{boss.username}:</span>
          <ul className="mt-1 ml-4 list-disc marker:text-gray-400">
            {boss?.parameters?.map((p, j) => (
              <li key={j} className="text-gray-600 leading-relaxed">
                {p.content}
              </li>
            ))}
          </ul>
        </div>
      ))}
      {hasMore && (
        <button
          className="text-blue-600 hover:text-blue-800 font-medium text-xs mt-1 transition-colors bg-transparent border-none cursor-pointer p-0"
          onClick={toggleShowAll}
        >
          {showAll ? (
            <><i className="fas fa-chevron-up mr-1 text-[10px]"></i> Thu gọn</>
          ) : (
            <><i className="fas fa-chevron-down mr-1 text-[10px]"></i> Xem thêm</>
          )}
        </button>
      )}
    </div>
  );
};

export default ScheduleBossesDisplay;
