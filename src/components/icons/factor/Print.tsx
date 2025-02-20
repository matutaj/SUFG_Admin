import { SvgIcon, SvgIconProps } from '@mui/material';

const Print = (props: SvgIconProps) => {
  return (
    <SvgIcon width="20" height="21" viewBox="0 0 20 21" fill="none" {...props}>
      <svg xmlns="http://www.w3.org/2000/svg" width={512} height={512} viewBox="0 0 512 512">
        <path
          fill="none"
          stroke="currentColor"
          strokeLinejoin="round"
          strokeWidth={32}
          d="M384 368h24a40.12 40.12 0 0 0 40-40V168a40.12 40.12 0 0 0-40-40H104a40.12 40.12 0 0 0-40 40v160a40.12 40.12 0 0 0 40 40h24"
        ></path>
        <rect
          width={256}
          height={208}
          x={128}
          y={240}
          fill="none"
          stroke="currentColor"
          strokeLinejoin="round"
          strokeWidth={32}
          rx={24.32}
          ry={24.32}
        ></rect>
        <path
          fill="none"
          stroke="currentColor"
          strokeLinejoin="round"
          strokeWidth={32}
          d="M384 128v-24a40.12 40.12 0 0 0-40-40H168a40.12 40.12 0 0 0-40 40v24"
        ></path>
        <circle cx={392} cy={184} r={24} fill="currentColor"></circle>
      </svg>
    </SvgIcon>
  );
};

export default Print;
