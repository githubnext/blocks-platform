import { Tooltip } from "./Tooltip"

interface AvatarProps {
  username: string;
  size?: 'small' | 'medium' | 'large';
  status?: 'active' | 'inactive';
}

const sizeClassMap = {
  small: 'w-8 h-8',
  medium: 'w-10 h-10',
  large: 'w-12 h-12',
};

const urlBase = `https://avatars.githubusercontent.com/`;

export const AvatarList: React.FC = ({ children }) => {
  return (
    <div className="flex -space-x-3 hover:space-x-0">
      {children}
    </div>
  );
};

export function Avatar(props: AvatarProps) {
  const { username, size = 'small', status } = props;
  const url = `https://github.com/${username}`;

  const sizeClasses = {
    small: 'w-8 h-8',
    medium: 'w-10 h-10',
    large: 'w-12 h-12',
  }[size];

  return (
    <Tooltip key={username} text={username}>
      <div className="relative inline-block transition-all">
        <a
          className={`${sizeClasses} block rounded-full bg-cover border-[0.17em] border-white transition-all focus:outline-none focus:ring`}
          href={url}
          target="_blank"
          style={{
            backgroundImage: `url(${urlBase}/${username}`,
          }}
        />

        {status && (
          <span
            className={`absolute bottom-0 right-0 block h-2.5 w-2.5 rounded-full ring-2 ring-white ${status === 'active' ? 'bg-green-400' : 'bg-gray-300'
              }`}
          />
        )}
      </div>
    </Tooltip>
  );
}
