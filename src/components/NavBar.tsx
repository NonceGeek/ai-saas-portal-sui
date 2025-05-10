import Image from "next/image";
import { NavItem } from "./NavItem";
import TaskAltIcon from '@mui/icons-material/TaskAlt';
import PlayCircleIcon from '@mui/icons-material/PlayCircle';
import CodeIcon from '@mui/icons-material/Code';
import {
  MODULE_URL
} from "../lib/utils/constants";
import { useWindowSize } from 'usehooks-ts';

export function NavBar() {
  const { width } = useWindowSize();
  return (
    <nav className="navbar py-4 px-4 bg-base-100">
      <div className="flex-1 flex items-center gap-4">
        <ul className="menu menu-horizontal flex items-center gap-2">
          
          {/* <NavItem href="/example_ui" title="UI" /> | */}
          <NavItem href="/" title="Home" className="font-sans font-semibold text-base" /> |
          {/* <NavItem href="/all_tasks" title="All Tasks" className="font-sans font-semibold text-base" /> |  */}
          {
            width > 768 && (
              <li className="sm:block font-sans font-semibold text-base flex gap-2">
                <a href="https://general.ai-saas.rootmud.xyz/tasks" target="_blank" rel="noreferrer">All Tasks</a> |
                <a href="https://youtu.be/faEpYqyMrig" target="_blank" rel="noreferrer">🎥 Video</a> |
                <a href="https://pitch.com/v/team08_deck_taishang-ai-q83rfw" target="_blank" rel="noreferrer">📑 Deck</a> |
                <a href="https://github.com/NonceGeek/tai-shang-micro-ai-saas" target="_blank" rel="noreferrer">Source Code</a>
              </li>
            )
          }
          {
            width < 768 && (
              <li className="sm:block font-sans font-semibold text-base flex gap-2">
                <a href="https://general.ai-saas.rootmud.xyz/tasks" target="_blank" rel="noreferrer"><TaskAltIcon/></a>
                <a href="https://youtu.be/faEpYqyMrig" target="_blank" rel="noreferrer"><PlayCircleIcon/></a>
                <a href="https://pitch.com/v/team08_deck_taishang-ai-q83rfw" target="_blank" rel="noreferrer">📑</a>
                <a href="https://github.com/NonceGeek/tai-shang-micro-ai-saas" target="_blank" rel="noreferrer"><CodeIcon/></a>
              </li>
            )
          }
        </ul>
      </div>
    </nav>
  );
}
