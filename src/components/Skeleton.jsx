import React from 'react';

export const Skeleton = ({ className = '', width, height, style = {} }) => {
  return (
    <div
      className={`skeleton ${className}`}
      style={{
        width: width || '100%',
        height: height || '16px',
        ...style,
      }}
    />
  );
};

export const SkeletonKPI = () => {
  return (
    <div className="kpi">
      <div className="flex items-center gap-2">
        <Skeleton width="28px" height="28px" style={{ borderRadius: '50%' }} />
        <Skeleton width="90px" height="14px" />
      </div>
      <div className="my-3">
        <Skeleton width="130px" height="28px" />
      </div>
      <div className="flex items-center gap-2">
        <Skeleton width="50px" height="12px" />
        <Skeleton width="80px" height="12px" />
      </div>
      <div className="mt-3">
        <Skeleton width="100%" height="40px" />
      </div>
    </div>
  );
};

export const SkeletonChart = () => {
  return (
    <div className="card2">
      <div className="h">
        <div>
          <Skeleton width="140px" height="18px" />
          <div className="mt-1">
            <Skeleton width="200px" height="12px" />
          </div>
        </div>
        <Skeleton width="110px" height="28px" style={{ borderRadius: '10px' }} />
      </div>
      <div className="flex gap-4 my-3">
        <Skeleton width="90px" height="14px" />
        <Skeleton width="90px" height="14px" />
      </div>
      <div className="h-64 flex items-end justify-between gap-3 pt-6 px-4">
        {[40, 75, 55, 90, 60, 80, 45].map((h, i) => (
          <div key={i} className="flex-1 flex flex-col justify-end items-center gap-2 h-full">
            <Skeleton width="100%" height={`${h}%`} style={{ borderRadius: '6px 6px 0 0' }} />
            <Skeleton width="30px" height="10px" />
          </div>
        ))}
      </div>
    </div>
  );
};

export const SkeletonList = ({ count = 5 }) => {
  return (
    <div className="card2">
      <div className="h">
        <Skeleton width="120px" height="18px" />
        <Skeleton width="32px" height="32px" style={{ borderRadius: '8px' }} />
      </div>
      <div className="space-y-3 mt-4">
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} className="flex items-center justify-between py-2 border-b border-[var(--line)]">
            <div className="flex items-center gap-3">
              <Skeleton width="34px" height="34px" style={{ borderRadius: '50%' }} />
              <div>
                <Skeleton width="110px" height="14px" />
                <div className="mt-1">
                  <Skeleton width="70px" height="11px" />
                </div>
              </div>
            </div>
            <div className="text-right">
              <Skeleton width="60px" height="14px" />
              <div className="mt-1">
                <Skeleton width="40px" height="11px" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Skeleton;
