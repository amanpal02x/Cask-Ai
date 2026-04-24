import React, { useEffect, useRef } from 'react';

interface Point {
  x: number;
  y: number;
}

interface SkeletonFrame {
  points: { [key: string]: Point };
}

interface ExerciseSimulatorProps {
  exerciseName: string;
  isRecording: boolean;
  speed?: number;
}

const ExerciseSimulator: React.FC<ExerciseSimulatorProps> = ({ 
  exerciseName, 
  isRecording,
  speed = 1
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const frameRef = useRef<number>(0);
  // const animationRef = useRef<number | null>(null);

  // Procedural keyframes for different exercises (simplified skeletal points 0-1 range)
  const getFrames = (name: string): SkeletonFrame[] => {
    const n = name.toLowerCase();
    
    // Squat simulation
    if (n.includes('squat')) {
      return Array.from({ length: 60 }, (_, i) => {
        const t = Math.sin((i / 60) * Math.PI); // 0 to 1 back to 0
        const squatDepth = t * 0.3;
        return {
          points: {
            head: { x: 0.5, y: 0.1 + squatDepth },
            shoulder: { x: 0.5, y: 0.2 + squatDepth },
            hip: { x: 0.5, y: 0.5 + squatDepth },
            knee_l: { x: 0.4, y: 0.7 + squatDepth * 0.5 },
            knee_r: { x: 0.6, y: 0.7 + squatDepth * 0.5 },
            ankle_l: { x: 0.4, y: 0.9 },
            ankle_r: { x: 0.6, y: 0.9 }
          }
        };
      });
    }
    
    // Pushup simulation
    if (n.includes('pushup') || n.includes('push-up')) {
      return Array.from({ length: 60 }, (_, i) => {
        const t = Math.sin((i / 60) * Math.PI);
        const pushDepth = t * 0.15;
        return {
          points: {
            head: { x: 0.2, y: 0.55 + pushDepth },
            shoulder: { x: 0.3, y: 0.6 + pushDepth },
            elbow: { x: 0.35, y: 0.75 + pushDepth * 0.3 },
            hip: { x: 0.6, y: 0.6 },
            ankle: { x: 0.9, y: 0.6 }
          }
        };
      });
    }

    // Knee Extension simulation
    if (n.includes('knee extension')) {
      return Array.from({ length: 60 }, (_, i) => {
        const t = Math.sin((i / 60) * Math.PI);
        return {
          points: {
            head: { x: 0.5, y: 0.1 },
            shoulder: { x: 0.5, y: 0.2 },
            hip: { x: 0.5, y: 0.5 },
            knee: { x: 0.5, y: 0.7 },
            ankle: { x: 0.5 + t * 0.2, y: 0.9 - t * 0.1 }
          }
        };
      });
    }

    // Shoulder Abduction simulation - More premium arc and body movement
    if (n.includes('shoulder abduction') || n.includes('abduction')) {
      return Array.from({ length: 100 }, (_, i) => {
        const t = Math.sin((i / 100) * Math.PI);
        const armAngle = t * (Math.PI / 1.8); // Slightly past 90 deg
        const bodySway = Math.sin((i / 100) * Math.PI * 2) * 0.01;
        return {
          points: {
            head: { x: 0.5 + bodySway, y: 0.14 },
            shoulder: { x: 0.5 + bodySway, y: 0.25 },
            hip: { x: 0.5, y: 0.55 },
            elbow_l: { x: 0.5 - Math.sin(armAngle) * 0.18, y: 0.25 + Math.cos(armAngle) * 0.18 },
            elbow_r: { x: 0.5 + Math.sin(armAngle) * 0.18, y: 0.25 + Math.cos(armAngle) * 0.18 },
            wrist_l: { x: 0.5 - Math.sin(armAngle) * 0.38, y: 0.25 + Math.cos(armAngle) * 0.38 },
            wrist_r: { x: 0.5 + Math.sin(armAngle) * 0.38, y: 0.25 + Math.cos(armAngle) * 0.38 },
            knee_l: { x: 0.44, y: 0.75 },
            knee_r: { x: 0.56, y: 0.75 },
            ankle_l: { x: 0.44, y: 0.96 },
            ankle_r: { x: 0.56, y: 0.96 }
          }
        };
      });
    }

    // Plank simulation - Added stability trembling for premium feel
    if (n.includes('plank')) {
      return Array.from({ length: 60 }, (_, i) => {
        const tremble = Math.sin(i * 1.5) * 0.002;
        const breath = Math.sin(i * 0.2) * 0.005;
        return {
          points: {
            head: { x: 0.12, y: 0.65 + tremble + breath },
            shoulder: { x: 0.22, y: 0.7 + tremble },
            elbow: { x: 0.22, y: 0.88 },
            hip: { x: 0.52, y: 0.72 + tremble + breath },
            knee: { x: 0.75, y: 0.74 + tremble },
            ankle: { x: 0.92, y: 0.75 }
          }
        };
      });
    }

    // Lunge simulation - Improved balance and depth
    if (n.includes('lunge')) {
      return Array.from({ length: 120 }, (_, i) => {
        const t = Math.sin((i / 120) * Math.PI);
        const drop = t * 0.28;
        const torsoLean = t * 0.02;
        return {
          points: {
            head: { x: 0.5 + torsoLean, y: 0.14 + drop },
            shoulder: { x: 0.5 + torsoLean, y: 0.25 + drop },
            hip: { x: 0.5, y: 0.55 + drop },
            knee_l: { x: 0.72, y: 0.62 + drop * 0.4 }, // Front knee stability
            ankle_l: { x: 0.72, y: 0.96 },
            knee_r: { x: 0.28, y: 0.7 + drop * 1.05 }, // Back knee depth
            ankle_r: { x: 0.12, y: 0.96 }
          }
        };
      });
    }

    // Default standing/idle
    return [{
      points: {
        head: { x: 0.5, y: 0.1 },
        shoulder: { x: 0.5, y: 0.2 },
        hip: { x: 0.5, y: 0.5 },
        knee_l: { x: 0.4, y: 0.7 },
        knee_r: { x: 0.6, y: 0.7 },
        ankle_l: { x: 0.4, y: 0.9 },
        ankle_r: { x: 0.6, y: 0.9 }
      }
    }];
  };

  const drawFrame = (ctx: CanvasRenderingContext2D, frame: SkeletonFrame) => {
    const { width, height } = ctx.canvas;
    ctx.clearRect(0, 0, width, height);
    
    // Background style
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(0, 0, width, height);

    const pts = frame.points;
    const scale = (p: Point) => ({ x: p.x * width, y: p.y * height });

    ctx.strokeStyle = '#4f46e5'; // Primary indigo
    ctx.lineWidth = 5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    const drawLine = (p1: Point, p2: Point) => {
      const s1 = scale(p1);
      const s2 = scale(p2);
      ctx.beginPath();
      ctx.moveTo(s1.x, s1.y);
      ctx.lineTo(s2.x, s2.y);
      ctx.stroke();
    };

    // Draw Skeleton
    if (pts.head) {
        const head = scale(pts.head);
        ctx.beginPath();
        ctx.arc(head.x, head.y, 12, 0, Math.PI * 2);
        ctx.stroke();
    }
    
    if (pts.head && pts.shoulder) drawLine(pts.head, pts.shoulder);
    if (pts.shoulder && pts.hip) drawLine(pts.shoulder, pts.hip);
    
    // Leg L
    if (pts.hip && pts.knee_l) drawLine(pts.hip, pts.knee_l);
    if (pts.knee_l && pts.ankle_l) drawLine(pts.knee_l, pts.ankle_l);
    
    // Leg R
    if (pts.hip && pts.knee_r) drawLine(pts.hip, pts.knee_r);
    if (pts.knee_r && pts.ankle_r) drawLine(pts.knee_r, pts.ankle_r);

    // Single leg/body support for side views (like pushup)
    if (pts.knee && !pts.knee_l) drawLine(pts.hip, pts.knee);
    if (pts.knee && pts.ankle) drawLine(pts.knee, pts.ankle);
    if (pts.hip && pts.ankle && !pts.knee) drawLine(pts.hip, pts.ankle);

    // Arms
    if (pts.shoulder && pts.elbow_l) drawLine(pts.shoulder, pts.elbow_l);
    if (pts.shoulder && pts.elbow_r) drawLine(pts.shoulder, pts.elbow_r);
    if (pts.elbow_l && pts.wrist_l) drawLine(pts.elbow_l, pts.wrist_l);
    if (pts.elbow_r && pts.wrist_r) drawLine(pts.elbow_r, pts.wrist_r);
    
    // Single arm support (backward compatibility)
    if (pts.shoulder && pts.elbow && !pts.elbow_l) drawLine(pts.shoulder, pts.elbow);
    if (pts.elbow && pts.wrist && !pts.wrist_l) drawLine(pts.elbow, pts.wrist);
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const frames = getFrames(exerciseName);
    let frameId: number;
    
    const animate = () => {
      // The simulator should ALWAYS be live to show the user how to perform it
      // regardless of whether they have hit "Start" or not.
      frameRef.current = (frameRef.current + speed) % frames.length;
      
      drawFrame(ctx, frames[Math.floor(frameRef.current)]);
      frameId = requestAnimationFrame(animate);
    };

    frameId = requestAnimationFrame(animate);
    return () => {
      cancelAnimationFrame(frameId);
    };
  }, [exerciseName, speed]); // Removed isRecording from dependency to keep it always live

  return (
    <div className="relative bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="absolute top-3 left-3 z-10 flex items-center space-x-2">
        <span className="px-2 py-1 bg-indigo-100 text-indigo-700 text-[10px] font-bold uppercase tracking-wider rounded">
          Guide
        </span>
        <div className="flex space-x-1">
            <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-pulse"></div>
        </div>
      </div>
      <canvas 
        ref={canvasRef} 
        width={300} 
        height={200} 
        className="w-full h-40 object-contain"
      />
      <div className="p-3 bg-indigo-50 border-t border-indigo-100">
        <p className="text-[11px] text-indigo-600 text-center font-semibold">
          WATCH & FOLLOW THIS MOTION
        </p>
      </div>
    </div>
  );
};

export default ExerciseSimulator;
