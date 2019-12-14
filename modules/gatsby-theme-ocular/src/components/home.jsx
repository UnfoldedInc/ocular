// Copyright (c) 2018 Uber Technologies, Inc.
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in
// all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
// THE SOFTWARE.

import React, {Component} from 'react';
import WebsiteConfigConsumer from './layout/website-config';
import Hero from './hero';
import GithubContributors from './github/github-contributors';

function renderPage({config, HeroExample}) {
  const {
    HOME_HEADING,
    HOME_RIGHT = '',
    HOME_BULLETS = [],
    PROJECT_TYPE
  } = config;

  // Note: The Layout "wrapper" component adds header and footer etc
  return (
    <div className="fg">
      <Hero HeroExample={HeroExample} />
      <div className="fg p4">
        <div className="container f fw">
          <div className="f1 p" style={{minWidth: '10rem'}}>
            <h2>{HOME_HEADING}</h2>
            <hr className="short" />
            {HOME_BULLETS.map(bullet => (
              <div key={bullet.text}>
                <h3 className="fac">
                  <img src={bullet.img} className="m-right" alt="" />
                  {bullet.text}
                </h3>
                {bullet.desc && <p>{bullet.desc}</p>}
              </div>
            ))}
          </div>
          <div className="f1 p" style={{minWidth: '10rem'}}>
            {HOME_RIGHT}
          </div>
        </div>
        {PROJECT_TYPE === 'github' && (
          <div className="container">
            <hr className="short" />
            <h3>Contributors</h3>
            <span>Join us!</span>
            <div className="Contributors m-top">
              <GithubContributors
                project={`${config.PROJECT_ORG}/${config.PROJECT_NAME}`}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default class Home extends Component {
  render() {
    const {HeroExample} = this.props;
    return (
      <main>
        <WebsiteConfigConsumer>
          {({config}) => renderPage({config, HeroExample})}
        </WebsiteConfigConsumer>
      </main>
    );
  }
}