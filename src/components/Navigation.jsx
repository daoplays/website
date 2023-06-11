import React from "react";
import { NavLink } from "react-router-dom";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { brands } from '@fortawesome/fontawesome-svg-core/import.macro' // <-- import styles to be used

function Navigation() {
  return (
    <div className="navigation">
      <nav className="navbar navbar-expand navbar-dark bg-dark">
        <div className="container">
          <NavLink className="navbar-brand" to="/">
            DaoPlays
          </NavLink>
          <div>
            <ul className="navbar-nav ml-auto">
              <li className="nav-item">
                <NavLink className="nav-link" to="/blog">
                  Blog
                </NavLink>
              </li>
              <li className="nav-item">
                <a className="nav-link" href="http://www.twitter.com/dao_plays">
                 <FontAwesomeIcon icon={brands('twitter')} size="lg"/>
                </a>
              </li>
              <li className="nav-item">
                <a className="nav-link" href="http://www.discord.gg/4KbYFt3cSg">
                  <FontAwesomeIcon icon={brands('discord')} size="lg" />
                </a>
              </li>
              <li className="nav-item">
                <a className="nav-link" href="http://www.twitch.tv/daoplays_">
                  <FontAwesomeIcon icon={brands('twitch')} size="lg" />
                </a>
              </li>
              <li className="nav-item">
                <a className="nav-link" href="http://www.github.com/daoplays">
                  <FontAwesomeIcon icon={brands('github')} size="lg" />
                </a>
              </li>
            </ul>
          </div>
        </div>
      </nav>
    </div>
  );
}

export default Navigation;
