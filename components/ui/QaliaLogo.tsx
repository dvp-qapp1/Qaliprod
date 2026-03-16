interface QaliaLogoProps {
    className?: string;
    color?: string;
}

export function QaliaLogo({
    className = "w-8 h-8",
    color = "#10B981"
}: QaliaLogoProps) {
    return (
        <svg
            className={className}
            viewBox="0 0 2084 2084"
            xmlns="http://www.w3.org/2000/svg"
            style={{ fillRule: 'evenodd', clipRule: 'evenodd', strokeLinejoin: 'round', strokeMiterlimit: 2 }}
        >
            <g>
                <ellipse
                    cx="1806.063"
                    cy="1734.315"
                    rx="277.27"
                    ry="291.192"
                    style={{ fill: color }}
                />
                <path
                    d="M1020.909,536.175c281.727,0 510.454,240.252 510.454,536.175c0,295.923 -228.727,536.175 -510.454,536.175c-281.727,0 -510.454,-240.252 -510.454,-536.175c0,-295.923 228.727,-536.175 510.454,-536.175Zm13.303,1547.159c-563.455,0 -1034.212,-419.138 -1034.212,-1010.984c0,-591.846 457.454,-1072.349 1020.909,-1072.349c563.455,0 985.596,437.753 930.251,1026.738c-14.372,152.95 -17.021,217.345 -117.192,259.919c-90.521,38.472 -211.371,26.977 -337.086,200.287c-164.337,226.555 -42.485,329.483 -174.186,472.748c-47.238,51.386 -130.828,123.641 -288.484,123.641Z"
                    style={{ fill: color }}
                />
            </g>
        </svg>
    );
}
