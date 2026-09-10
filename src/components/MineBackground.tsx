import React, { useEffect, useRef } from 'react';

interface MineBackgroundProps {
  hazardDetected: boolean;
}

// Renders a realistic open-cast mine pit (terraced benches, haul road,
// dust haze) with a properly proportioned haul-truck silhouette —
// cab, sloped dump bed, exhaust stack, and large rear wheels —
// rather than an abstract shape.
export const MineBackground: React.FC<MineBackgroundProps> = ({ hazardDetected }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    const dustParticles = Array.from({ length: 55 }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      radius: Math.random() * 150 + 70,
      vx: (Math.random() - 0.5) * 0.3,
      vy: (Math.random() - 0.5) * 0.15,
      alpha: Math.random() * 0.15 + 0.04,
    }));

    let waves: { x: number; y: number; r: number; maxR: number; opacity: number }[] = [];
    let time = 0;

    const drawBench = (yTop: number, yBottom: number, colorTop: string, colorFace: string) => {
      // A single terraced pit bench: flat top + sloped rock face
      ctx.fillStyle = colorFace;
      ctx.beginPath();
      ctx.moveTo(0, yTop);
      ctx.lineTo(width * 0.32, yTop + 14);
      ctx.lineTo(width * 0.68, yTop + 6);
      ctx.lineTo(width, yTop + 18);
      ctx.lineTo(width, yBottom);
      ctx.lineTo(0, yBottom);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = colorTop;
      ctx.beginPath();
      ctx.moveTo(0, yTop - 10);
      ctx.lineTo(width * 0.32, yTop + 4);
      ctx.lineTo(width * 0.68, yTop - 4);
      ctx.lineTo(width, yTop + 8);
      ctx.lineTo(width, yTop + 18);
      ctx.lineTo(width * 0.68, yTop + 6);
      ctx.lineTo(width * 0.32, yTop + 14);
      ctx.lineTo(0, yTop);
      ctx.closePath();
      ctx.fill();
    };

    const drawHaulTruck = (truckX: number, truckY: number, truckScale: number) => {
      ctx.save();
      ctx.translate(truckX, truckY);

      // Ground contact shadow
      ctx.fillStyle = 'rgba(0,0,0,0.55)';
      ctx.beginPath();
      ctx.ellipse(0, 78 * truckScale, 195 * truckScale, 20 * truckScale, 0, 0, Math.PI * 2);
      ctx.fill();

      // Rear dual wheels (large, iconic mining-truck tires)
      const wheelColor = '#0c0705';
      const rimColor = '#26150c';
      [-150, -78].forEach((wx) => {
        ctx.fillStyle = wheelColor;
        ctx.beginPath();
        ctx.arc(wx * truckScale, 58 * truckScale, 52 * truckScale, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = rimColor;
        ctx.beginPath();
        ctx.arc(wx * truckScale, 58 * truckScale, 22 * truckScale, 0, Math.PI * 2);
        ctx.fill();
      });
      // Front wheel (smaller, steer axle)
      ctx.fillStyle = wheelColor;
      ctx.beginPath();
      ctx.arc(148 * truckScale, 62 * truckScale, 34 * truckScale, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = rimColor;
      ctx.beginPath();
      ctx.arc(148 * truckScale, 62 * truckScale, 15 * truckScale, 0, Math.PI * 2);
      ctx.fill();

      // Chassis / frame rail
      ctx.fillStyle = '#1c100a';
      ctx.fillRect(-190 * truckScale, 30 * truckScale, 380 * truckScale, 22 * truckScale);

      // Dump body (sloped rear bed, the truck's signature silhouette)
      ctx.fillStyle = '#1e120a';
      ctx.strokeStyle = '#3d2414';
      ctx.lineWidth = 2.5 * truckScale;
      ctx.beginPath();
      ctx.moveTo(-195 * truckScale, 30 * truckScale);
      ctx.lineTo(-195 * truckScale, -55 * truckScale);
      ctx.lineTo(-140 * truckScale, -95 * truckScale);
      ctx.lineTo(20 * truckScale, -95 * truckScale);
      ctx.lineTo(55 * truckScale, -30 * truckScale);
      ctx.lineTo(55 * truckScale, 30 * truckScale);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Dump-body rim highlight
      ctx.strokeStyle = '#4a2c18';
      ctx.lineWidth = 3 * truckScale;
      ctx.beginPath();
      ctx.moveTo(-195 * truckScale, -55 * truckScale);
      ctx.lineTo(-140 * truckScale, -95 * truckScale);
      ctx.lineTo(20 * truckScale, -95 * truckScale);
      ctx.stroke();

      // Cab (forward, lower profile than the dump body)
      ctx.fillStyle = '#241609';
      ctx.strokeStyle = '#3d2414';
      ctx.lineWidth = 2.5 * truckScale;
      ctx.beginPath();
      ctx.moveTo(58 * truckScale, 30 * truckScale);
      ctx.lineTo(58 * truckScale, -38 * truckScale);
      ctx.lineTo(92 * truckScale, -58 * truckScale);
      ctx.lineTo(150 * truckScale, -55 * truckScale);
      ctx.lineTo(165 * truckScale, -12 * truckScale);
      ctx.lineTo(165 * truckScale, 30 * truckScale);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Windshield
      ctx.fillStyle = hazardDetected ? 'rgba(120,20,20,0.55)' : 'rgba(40,30,15,0.6)';
      ctx.beginPath();
      ctx.moveTo(96 * truckScale, -52 * truckScale);
      ctx.lineTo(146 * truckScale, -49 * truckScale);
      ctx.lineTo(150 * truckScale, -20 * truckScale);
      ctx.lineTo(98 * truckScale, -22 * truckScale);
      ctx.closePath();
      ctx.fill();

      // Exhaust stack
      ctx.fillStyle = '#161009';
      ctx.fillRect(60 * truckScale, -98 * truckScale, 12 * truckScale, 42 * truckScale);

      // Headlight beam
      const beamGrad = ctx.createRadialGradient(
        168 * truckScale, -5 * truckScale, 4,
        420 * truckScale, 40 * truckScale, 420 * truckScale
      );
      if (hazardDetected) {
        beamGrad.addColorStop(0, 'rgba(196, 40, 40, 0.9)');
        beamGrad.addColorStop(0.35, 'rgba(196, 40, 40, 0.3)');
        beamGrad.addColorStop(1, 'rgba(196, 40, 40, 0)');
      } else {
        beamGrad.addColorStop(0, 'rgba(240, 214, 160, 0.75)');
        beamGrad.addColorStop(0.4, 'rgba(185, 129, 47, 0.22)');
        beamGrad.addColorStop(1, 'rgba(185, 129, 47, 0)');
      }
      ctx.fillStyle = beamGrad;
      ctx.beginPath();
      ctx.moveTo(168 * truckScale, -14 * truckScale);
      ctx.lineTo(width * 0.55, -260 * truckScale);
      ctx.lineTo(width * 0.55, 320 * truckScale);
      ctx.closePath();
      ctx.fill();

      // Headlamps
      ctx.fillStyle = hazardDetected ? '#e05555' : '#f7ecc8';
      ctx.shadowColor = hazardDetected ? '#e05555' : '#f0d6a0';
      ctx.shadowBlur = 26 * truckScale;
      ctx.beginPath();
      ctx.arc(168 * truckScale, -14 * truckScale, 7 * truckScale, 0, Math.PI * 2);
      ctx.arc(168 * truckScale, 4 * truckScale, 7 * truckScale, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;

      if (Math.random() < 0.045) {
        waves.push({
          x: 168 * truckScale,
          y: -6 * truckScale,
          r: 8,
          maxR: 340 * truckScale,
          opacity: 0.8,
        });
      }
      waves.forEach((w) => {
        w.r += 2.6;
        w.opacity = Math.max(0, 1 - w.r / w.maxR);
        ctx.beginPath();
        ctx.arc(w.x, w.y, w.r, 0, Math.PI * 2);
        ctx.strokeStyle = hazardDetected
          ? `rgba(196, 40, 40, ${w.opacity * 0.75})`
          : `rgba(185, 129, 47, ${w.opacity * 0.55})`;
        ctx.lineWidth = 1.6;
        ctx.setLineDash([7, 5]);
        ctx.stroke();
        ctx.setLineDash([]);
      });
      waves = waves.filter((w) => w.opacity > 0);

      ctx.restore();
    };

    const render = () => {
      time += 0.015;
      ctx.clearRect(0, 0, width, height);

      // Sky / haze above the pit
      const skyGrad = ctx.createLinearGradient(0, 0, 0, height * 0.4);
      skyGrad.addColorStop(0, '#0b0705');
      skyGrad.addColorStop(1, '#150c07');
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, width, height * 0.42);

      // Terraced pit benches receding into the distance
      drawBench(height * 0.40, height * 0.55, '#241408', '#180d06');
      drawBench(height * 0.55, height * 0.70, '#2c1a0d', '#1d1108');
      drawBench(height * 0.70, height * 0.86, '#33200f', '#22140a');
      drawBench(height * 0.86, height, '#3a2513', '#271609');

      // Haul-road wheel ruts running toward the truck
      ctx.strokeStyle = 'rgba(74, 44, 24, 0.35)';
      ctx.lineWidth = Math.max(2, width * 0.006);
      ctx.beginPath();
      ctx.moveTo(width * 0.46, height);
      ctx.quadraticCurveTo(width * 0.5, height * 0.75, width * 0.53, height * 0.63);
      ctx.moveTo(width * 0.6, height);
      ctx.quadraticCurveTo(width * 0.56, height * 0.75, width * 0.55, height * 0.63);
      ctx.stroke();

      const truckX = width * 0.54;
      const truckY = height * 0.68;
      const truckScale = Math.min(width, height) / 780;
      drawHaulTruck(truckX, truckY, truckScale);

      // Rolling dust haze over everything
      dustParticles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < -p.radius) p.x = width + p.radius;
        if (p.x > width + p.radius) p.x = -p.radius;
        if (p.y < -p.radius) p.y = height + p.radius;
        if (p.y > height + p.radius) p.y = -p.radius;

        const fGrad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.radius);
        fGrad.addColorStop(0, `rgba(44, 28, 16, ${p.alpha * 1.5})`);
        fGrad.addColorStop(0.6, `rgba(22, 14, 8, ${p.alpha * 0.85})`);
        fGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');

        ctx.fillStyle = fGrad;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fill();
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, [hazardDetected]);

  return (
    <div className="absolute inset-0 h-full w-full overflow-hidden bg-[#0a0705] select-none pointer-events-none">
      <canvas ref={canvasRef} className="absolute inset-0 h-full w-full object-cover lg:scale-[1.05]" />
      <div className="absolute inset-0 bg-radial from-transparent via-[#0a0705]/40 to-[#0a0705]/92 pointer-events-none" />
      {hazardDetected && (
        <div className="absolute inset-0 bg-red-900/15 backdrop-brightness-125 animate-pulse pointer-events-none z-0" />
      )}
    </div>
  );
};
