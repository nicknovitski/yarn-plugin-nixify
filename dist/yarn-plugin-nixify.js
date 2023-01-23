module.exports={name:"yarn-plugin-nixify",factory:function(e){var t;return(()=>{"use strict";var n={d:(e,t)=>{for(var r in t)n.o(t,r)&&!n.o(e,r)&&Object.defineProperty(e,r,{enumerable:!0,get:t[r]})},o:(e,t)=>Object.prototype.hasOwnProperty.call(e,t),r:e=>{"undefined"!=typeof Symbol&&Symbol.toStringTag&&Object.defineProperty(e,Symbol.toStringTag,{value:"Module"}),Object.defineProperty(e,"__esModule",{value:!0})}},r={};n.r(r),n.d(r,{default:()=>P});const o=e("@yarnpkg/core"),i=e("clipanion");class a extends i.Command{constructor(...e){super(...e),this.locator=i.Option.String()}async execute(){const e=await o.Configuration.find(this.context.cwd,this.context.plugins),{project:t}=await o.Project.find(e,this.context.cwd),n=await o.Cache.find(e),r=e.makeFetcher();return(await o.StreamReport.start({configuration:e,stdout:this.context.stdout},(async e=>{const{locatorHash:i}=o.structUtils.parseLocator(this.locator,!0),a=t.originalPackages.get(i);a?await r.fetch(a,{checksums:t.storedChecksums,project:t,cache:n,fetcher:r,report:e}):e.reportError(0,"Invalid locator")}))).exitCode()}}a.paths=[["nixify","fetch-one"]];const s=e("@yarnpkg/fslib"),c=e("crypto");class l extends i.Command{constructor(...e){super(...e),this.locator=i.Option.String(),this.source=i.Option.String(),this.installLocation=i.Option.String()}async execute(){const e=await o.Configuration.find(this.context.cwd,this.context.plugins),{project:t}=await o.Project.find(e,this.context.cwd);return await t.restoreInstallState({restoreResolutions:!1}),(await o.StreamReport.start({configuration:e,stdout:this.context.stdout},(async n=>{await t.resolveEverything({report:n,lockfileOnly:!0});const r=o.structUtils.parseLocator(this.locator,!0),i=t.storedPackages.get(r.locatorHash);if(!i)return void n.reportError(0,"Invalid locator");const a=s.ppath.join(t.cwd,this.installLocation);await s.xfs.mkdirpPromise(s.ppath.dirname(a)),await o.execUtils.execvp("cp",["-R",this.source,a],{cwd:t.cwd,strict:!0}),await o.execUtils.execvp("chmod",["-R","u+w",a],{cwd:t.cwd,strict:!0});const l=(0,c.createHash)("sha512");l.update(process.versions.node),e.triggerHook((e=>e.globalHashGeneration),t,(e=>{l.update("\0"),l.update(e)}));const d=l.digest("hex"),p=new Map,h=e=>{let n=p.get(e.locatorHash);if(void 0!==n)return n;const r=t.storedPackages.get(e.locatorHash);if(void 0===r)throw new Error("Assertion failed: The package should have been registered");const i=(0,c.createHash)("sha512");i.update(e.locatorHash),p.set(e.locatorHash,"<recursive>");for(const e of r.dependencies.values()){const n=t.storedResolutions.get(e.descriptorHash);if(void 0===n)throw new Error(`Assertion failed: The resolution (${o.structUtils.prettyDescriptor(t.configuration,e)}) should have been registered`);const r=t.storedPackages.get(n);if(void 0===r)throw new Error("Assertion failed: The package should have been registered");i.update(h(r))}return n=i.digest("hex"),p.set(e.locatorHash,n),n},u=(0,c.createHash)("sha512").update(d).update(h(i)).update(a).digest("hex");t.storedBuildState.set(i.locatorHash,u),await t.persistInstallStateFile()}))).exitCode()}}l.paths=[["nixify","inject-build"]];const d=e("@yarnpkg/plugin-pnp"),p=JSON.stringify,h=(e,t,n=!1)=>t.split("\n").map((t=>t||n?e+t:t)).join("\n"),u=(e,t)=>{let n=e;for(const[e,r]of Object.entries(t))if("string"==typeof r&&(n=n.replace(new RegExp(`@@${e}@@`,"g"),r)),"boolean"==typeof r)for(;;){const t=n.split("\n"),o=t.indexOf(`#@@ IF ${e}`),i=t.indexOf(`#@@ ENDIF ${e}`);if(-1===o||i<o)break;r?(t.splice(i,1),t.splice(o,1)):t.splice(o,i-o+1),n=t.join("\n")}return n},f=e("url");class g extends i.Command{constructor(...e){super(...e),this.binDir=i.Option.String()}async execute(){const e=await o.Configuration.find(this.context.cwd,this.context.plugins),{project:t,workspace:n}=await o.Project.find(e,this.context.cwd);return(await o.StreamReport.start({configuration:e,stdout:this.context.stdout},(async r=>{if(!n)return;const i=s.npath.toPortablePath(this.binDir);for(const[r,o]of n.manifest.bin){const n=s.ppath.join(i,r),a=s.ppath.join(t.cwd,s.npath.toPortablePath(o));await this.writeWrapper(n,a,{configuration:e,project:t})}if(e.get("installNixBinariesForDependencies")){await t.resolveEverything({report:r,lockfileOnly:!0});const n=await o.scriptUtils.getPackageAccessibleBinaries(t.topLevelWorkspace.anchoredLocator,{project:t});for(const[r,[o,a]]of n.entries()){const n=s.ppath.join(i,r);await this.writeWrapper(n,s.npath.toPortablePath(a),{configuration:e,project:t})}}}))).exitCode()}async writeWrapper(e,t,{configuration:n,project:r}){let o;switch(n.get("nodeLinker")){case"pnp":{const e=(0,d.getPnpPath)(r),n=[];await s.xfs.existsPromise(e.cjs)&&n.push(`--require "${s.npath.fromPortablePath(e.cjs)}"`),await s.xfs.existsPromise(e.esmLoader)&&n.push(`--experimental-loader "${(0,f.pathToFileURL)(s.npath.fromPortablePath(e.esmLoader)).href}"`),o=u("#!/bin/sh\nexport NODE_OPTIONS='@@NODE_OPTIONS@@'\nexec '@@NODE_PATH@@' '@@BINARY_PATH@@' \"$@\"\n",{NODE_PATH:process.execPath,NODE_OPTIONS:n.join(" "),BINARY_PATH:t});break}case"node-modules":o=u("#!/bin/sh\nexec '@@NODE_PATH@@' '@@BINARY_PATH@@' \"$@\"\n",{NODE_PATH:process.execPath,BINARY_PATH:t});break;default:throw Error("Assertion failed: Invalid nodeLinker")}await s.xfs.writeFilePromise(e,o),await s.xfs.chmodPromise(e,493)}}g.paths=[["nixify","install-bin"]];const m=e("@yarnpkg/plugin-patch"),y=(e,t)=>(0,c.createHash)(e).update(t).digest(),x=(e,t,n,r="/nix/store")=>{const o=n.toString("hex"),i=y("sha256",`fixed:out:${t}:${o}:`).toString("hex"),a=(e=>{let t="",n=[...e].reverse().map((e=>e.toString(2).padStart(8,"0"))).join("");for(;n;)t+="0123456789abcdfghijklmnpqrsvwxyz"[parseInt(n.slice(0,5),2)],n=n.slice(5);return t})(((e,t)=>{const n=Buffer.alloc(20);for(let t=0;t<e.length;t++)n[t%20]^=e[t];return n})(y("sha256",`output:out:sha256:${i}:${r}:${e}`)));return s.ppath.join(r,`${a}-${e}`)},b=e=>e.replace(/^\.+/,"").replace(/[^a-zA-Z0-9+._?=-]+/g,"-").slice(0,207)||"unknown",v=e("os"),w={commands:[a,l,g],hooks:{afterAllInstalled:async(e,t)=>{!1!==t.persistProject&&e.configuration.get("enableNixify")&&await(async(e,t)=>{const{configuration:n,cwd:r}=e,{cache:i,report:a}=t,c=await s.xfs.realpathPromise(s.npath.toPortablePath((0,v.tmpdir)()));if(e.cwd.startsWith(c))return void a.reportInfo(0,`Skipping Nixify, because ${e.cwd} appears to be a temporary directory`);const l=n.get("yarnPath"),d=n.get("nixExprPath");let f;l.startsWith(r)?f=s.ppath.relative(s.ppath.dirname(d),l):(f=l,a.reportWarning(0,`The Yarn path ${l} is outside the project - it may not be reachable by the Nix build`));const g=n.get("cacheFolder");let y=s.ppath.relative(r,g);y.startsWith("../")&&(y=g,a.reportWarning(0,`The cache folder ${g} is outside the project - it may not be reachable by the Nix build`));for(const e of n.sources.values())e.startsWith("<")||s.ppath.relative(r,e).startsWith("../")&&a.reportWarning(0,`The config file ${e} is outside the project - it may not be reachable by the Nix build`);const w=n.get("lockfileFilename"),P=new Map,$=new Set(await s.xfs.readdirPromise(i.cwd)),k={unstablePackages:e.conditionalLocators};for(const t of e.storedPackages.values()){const{locatorHash:n}=t,r=e.storedChecksums.get(n),a=i.getLocatorPath(t,r||null,k);if(!a)continue;const c=s.ppath.basename(a);if(!$.has(c))continue;const l=o.structUtils.stringifyLocator(t),d=r?r.split("/").pop():await o.hashUtils.checksumFile(a);P.set(l,{filename:c,sha512:d})}let E="cacheEntries = {\n";for(const e of[...P.keys()].sort()){const t=P.get(e);E+=`${p(e)} = { ${[`filename = ${p(t.filename)};`,`sha512 = ${p(t.sha512)};`].join(" ")} };\n`}E+="};";const S=n.get("isolatedNixBuilds");let T=new Set,N=[],j=[];const O=n.get("nodeLinker"),A=n.get("pnpUnpluggedFolder"),I=(t,n=new Set)=>{const r=o.structUtils.stringifyLocator(t);if(P.has(r)&&n.add(r),o.structUtils.isVirtualLocator(t)){const r=e.storedPackages.get(o.structUtils.devirtualizeLocator(t).locatorHash);if(!r)throw Error("Assertion failed: The locator should have been registered");I(r,n)}if(t.reference.startsWith("patch:")){const r=e.storedPackages.get(m.patchUtils.parseLocator(t).sourceLocator.locatorHash);if(!r)throw Error("Assertion failed: The locator should have been registered");I(r,n)}for(const r of t.dependencies.values()){const t=e.storedResolutions.get(r.descriptorHash);if(!t)throw Error("Assertion failed: The descriptor should have been registered");const o=e.storedPackages.get(t);if(!o)throw Error("Assertion failed: The locator should have been registered");I(o,n)}return n};for(const t of e.storedBuildState.keys()){const n=e.storedPackages.get(t);if(!n)throw Error("Assertion failed: The locator should have been registered");if(!S.includes(n.name))continue;let r;if("pnp"!==O)throw Error(`The nodeLinker ${O} is not supported for isolated Nix builds`);r=s.ppath.relative(e.cwd,s.ppath.join(A,o.structUtils.slugifyLocator(n),o.structUtils.getIdentVendorPath(n)));let i=n;if(o.structUtils.isVirtualLocator(i)){const{locatorHash:t}=o.structUtils.devirtualizeLocator(i),n=e.storedPackages.get(t);if(!n)throw Error("Assertion failed: The locator should have been registered");i=n}const a=o.structUtils.stringifyLocator(i),c=o.structUtils.stringifyLocator(n),l=`isolated.${p(a)}`;if(!T.has(i)){T.add(i);const e=[...I(n)].sort().map((e=>`${p(e)}\n`)).join(""),t=`override${_=n.name,_.split(/[^a-zA-Z0-9]+/g).filter((e=>e)).map((e=>{return(t=e).slice(0,1).toUpperCase()+t.slice(1);var t})).join("")}Attrs`;j.push(`${l} = optionalOverride (args.${t} or null) (mkIsolatedBuild { ${[`pname = ${p(n.name)};`,`version = ${p(n.version)};`,`reference = ${p(i.reference)};`,`locators = [\n${e}];`].join(" ")} });`)}0===N.length&&N.push("# Copy in isolated builds."),N.push(`echo 'injecting build for ${n.name}'`,"yarn nixify inject-build \\",`  ${p(c)} \\`,`  \${${l}} \\`,`  ${p(r)}`)}var _;if(N.length>0&&N.push("echo 'running yarn install'"),null==t.mode||0===S.length){const t=e.topLevelWorkspace.manifest.name,i=t?o.structUtils.stringifyIdent(t):"workspace",c=u("# This file is generated by running \"yarn install\" inside your project.\n# Manual changes might be lost - proceed with caution!\n\n{ lib, stdenv, nodejs, git, cacert, fetchurl, writeShellScript, writeShellScriptBin }:\n{ src, overrideAttrs ? null, ... } @ args:\n\nlet\n\n  cacheFolder = @@CACHE_FOLDER@@;\n#@@ IF NEED_ISOLATED_BUILD_SUPPRORT\n  lockfile = ./@@LOCKFILE@@;\n#@@ ENDIF NEED_ISOLATED_BUILD_SUPPRORT\n\n  # Call overrideAttrs on a derivation if a function is provided.\n  optionalOverride = fn: drv:\n    if fn == null then drv else drv.overrideAttrs fn;\n\n  # Simple stub that provides the global yarn command.\n  yarn = writeShellScriptBin \"yarn\" ''\n    exec '${nodejs}/bin/node' '${./@@YARN_PATH@@}' \"$@\"\n  '';\n\n  # Common attributes between Yarn derivations.\n  drvCommon = {\n    # Make sure the build uses the right Node.js version everywhere.\n    buildInputs = [ nodejs yarn ];\n    # Tell node-gyp to use the provided Node.js headers for native code builds.\n    npm_config_nodedir = nodejs;\n  };\n\n  # Comman variables that we set in a Nix build, but not in a Nix shell.\n  buildVars = ''\n    # Make Yarn produce friendlier logging for automated builds.\n    export CI=1\n    # Tell node-pre-gyp to never fetch binaries / always build from source.\n    export npm_config_build_from_source=true\n    # Disable Nixify plugin to save on some unnecessary processing.\n    export yarn_enable_nixify=false\n  '';\n\n  # Create derivations for fetching dependencies.\n  cacheDrvs = let\n    builder = writeShellScript \"yarn-cache-builder\" ''\n      source $stdenv/setup\n      cd \"$src\"\n      ${buildVars}\n      HOME=\"$TMP\" yarn_cache_folder=\"$TMP\" \\\n        yarn nixify fetch-one $locator\n      # Because we change the cache dir, Yarn may generate a different name.\n      mv \"$TMP/$(sed 's/-[^-]*\\.[^-]*$//' <<< \"$outputFilename\")\"-* $out\n    '';\n  in lib.mapAttrs (locator: { filename, sha512 }: stdenv.mkDerivation {\n    inherit src builder locator;\n    name = lib.strings.sanitizeDerivationName locator;\n    buildInputs = [ yarn git cacert ];\n    outputFilename = filename;\n    outputHashMode = \"flat\";\n    outputHashAlgo = \"sha512\";\n    outputHash = sha512;\n  }) cacheEntries;\n\n  # Create a shell snippet to copy dependencies from a list of derivations.\n  mkCacheBuilderForDrvs = drvs:\n    writeShellScript \"collect-yarn-cache\" (lib.concatMapStrings (drv: ''\n      cp ${drv} '${drv.outputFilename}'\n    '') drvs);\n\n#@@ IF NEED_ISOLATED_BUILD_SUPPRORT\n  # Create a shell snippet to copy dependencies from a list of locators.\n  mkCacheBuilderForLocators = let\n    pickCacheDrvs = map (locator: cacheDrvs.${locator});\n  in locators:\n    mkCacheBuilderForDrvs (pickCacheDrvs locators);\n\n  # Create a derivation that builds a node-pre-gyp module in isolation.\n  mkIsolatedBuild = { pname, version, reference, locators }: stdenv.mkDerivation (drvCommon // {\n    inherit pname version;\n    dontUnpack = true;\n\n    configurePhase = ''\n      ${buildVars}\n      unset yarn_enable_nixify # plugin is not present\n    '';\n\n    buildPhase = ''\n      mkdir -p .yarn/cache\n      pushd .yarn/cache > /dev/null\n      source ${mkCacheBuilderForLocators locators}\n      popd > /dev/null\n\n      echo '{ \"dependencies\": { \"${pname}\": \"${reference}\" } }' > package.json\n      install -m 0600 ${lockfile} ./yarn.lock\n      export yarn_global_folder=\"$TMP\"\n      export YARN_ENABLE_IMMUTABLE_INSTALLS=false\n      yarn --immutable-cache\n    '';\n\n    installPhase = ''\n      unplugged=( .yarn/unplugged/${pname}-*/node_modules/* )\n      if [[ ! -e \"''${unplugged[@]}\" ]]; then\n        echo >&2 \"Could not find the unplugged path for ${pname}\"\n        exit 1\n      fi\n\n      mv \"$unplugged\" $out\n    '';\n  });\n#@@ ENDIF NEED_ISOLATED_BUILD_SUPPRORT\n\n  # Main project derivation.\n  project = stdenv.mkDerivation (drvCommon // {\n    inherit src;\n    name = @@PROJECT_NAME@@;\n\n    configurePhase = ''\n      ${buildVars}\n\n      # Copy over the Yarn cache.\n      rm -fr '${cacheFolder}'\n      mkdir -p '${cacheFolder}'\n      pushd '${cacheFolder}' > /dev/null\n      source ${mkCacheBuilderForDrvs (lib.attrValues cacheDrvs)}\n      popd > /dev/null\n\n      # Yarn may need a writable home directory.\n      export yarn_global_folder=\"$TMP\"\n\n      # Some node-gyp calls may call out to npm, which could fail due to an\n      # read-only home dir.\n      export HOME=\"$TMP\"\n\n      # running preConfigure after the cache is populated allows for\n      # preConfigure to contain substituteInPlace for dependencies as well as the\n      # main project. This is necessary for native bindings that maybe have\n      # hardcoded values.\n      runHook preConfigure\n\n@@ISOLATED_INTEGRATION@@\n\n      # Run normal Yarn install to complete dependency installation.\n      yarn install --immutable --immutable-cache\n\n      runHook postConfigure\n    '';\n\n    buildPhase = ''\n      runHook preBuild\n      runHook postBuild\n    '';\n\n    installPhase = ''\n      runHook preInstall\n\n      mkdir -p \"$out/libexec/$name\" \"$out/bin\"\n\n      # Move the package contents to the output directory.\n      # - If the package.json has a `files` field, only files matching those patterns are copied\n      # - Otherwise all files are copied\n      yarn pack --out package.tgz\n      tar xzvf package.tgz --directory \"$out/libexec/$name\" --strip-components=1\n\n      cp .yarnrc* '@@LOCKFILE@@' \"$out/libexec/$name\"\n      cp --recursive .yarn \"$out/libexec/$name\"\n\n      # If the project uses the node-modules linker, then\n      # include the node_modules folder in the package.\n      if [ -d node_modules ]; then\n        cp --recursive node_modules \"$out/libexec/$name\"\n      else\n        # Otherwise, assume PnP. Copy the loader into the package.\n        cp .pnp.* \"$out/libexec/$name\"\n      fi\n\n      cd \"$out/libexec/$name\"\n\n      # Invoke a plugin internal command to setup binaries.\n      yarn nixify install-bin $out/bin\n\n      # A package with node_modules doesn't need the cache\n      if [ -d node_modules ]; then\n        yarn cache clean\n      fi\n\n      runHook postInstall\n    '';\n\n    passthru = {\n      inherit nodejs;\n      yarn-freestanding = yarn;\n      yarn = writeShellScriptBin \"yarn\" ''\n        exec '${yarn}/bin/yarn' --cwd '${overriddenProject}/libexec/${overriddenProject.name}' \"$@\"\n      '';\n    };\n  });\n\n  overriddenProject = optionalOverride overrideAttrs project;\n\n@@CACHE_ENTRIES@@\n@@ISOLATED@@\nin overriddenProject\n",{PROJECT_NAME:p(i),YARN_PATH:f,LOCKFILE:w,CACHE_FOLDER:p(y),CACHE_ENTRIES:E,ISOLATED:j.join("\n"),ISOLATED_INTEGRATION:h("      ",N.join("\n")),NEED_ISOLATED_BUILD_SUPPRORT:N.length>0});if(await s.xfs.writeFilePromise(d,c),n.get("generateDefaultNix")){const e=s.ppath.join(r,"default.nix"),t=s.ppath.join(r,"flake.nix");s.xfs.existsSync(e)||s.xfs.existsSync(t)||(await s.xfs.writeFilePromise(e,"# This is a minimal `default.nix` by yarn-plugin-nixify. You can customize it\n# as needed, it will not be overwritten by the plugin.\n\n{ pkgs ? import <nixpkgs> { } }:\n\npkgs.callPackage ./yarn-project.nix { } { src = ./.; }\n"),a.reportInfo(0,"A minimal default.nix was created. You may want to customize it."))}}n.get("enableNixPreload")&&s.xfs.existsSync(s.npath.toPortablePath("/nix/store"))&&await s.xfs.mktempPromise((async t=>{const n=[];for(const[e,{filename:r,sha512:o}]of P.entries()){const a=b(e),c=Buffer.from(o,"hex"),l=x(a,"sha512",c);if(!s.xfs.existsSync(l)){const e=s.ppath.join(t,o.slice(0,7));await s.xfs.mkdirPromise(e);const c=s.ppath.join(i.cwd,r),l=s.ppath.join(e,a);await s.xfs.copyFilePromise(c,l),n.push(l)}}try{const t=n.length;for(;0!==n.length;){const t=n.splice(0,100);await o.execUtils.execvp("nix-store",["--add-fixed","sha512",...t],{cwd:e.cwd,strict:!0})}0!==t&&a.reportInfo(0,`Preloaded ${t} packages into the Nix store`)}catch(e){if("ENOENT"!==e.code)throw e}}))})(e,t)}},configuration:{enableNixify:{description:"If false, disables the Nixify plugin hook that generates Nix expressions",type:o.SettingsType.BOOLEAN,default:!0},nixExprPath:{description:"Path of the file where the project Nix expression will be written to",type:o.SettingsType.ABSOLUTE_PATH,default:"./yarn-project.nix"},generateDefaultNix:{description:"If true, a default.nix will be generated if it does not exist",type:o.SettingsType.BOOLEAN,default:!0},enableNixPreload:{description:"If true, cached packages will be preloaded into the Nix store",type:o.SettingsType.BOOLEAN,default:!0},isolatedNixBuilds:{description:"Dependencies with a build step that can be built in an isolated derivation",type:o.SettingsType.STRING,default:[],isArray:!0},installNixBinariesForDependencies:{description:"If true, the Nix output 'bin' directory will also contain executables for binaries defined by dependencies",type:o.SettingsType.BOOLEAN,default:!1}}},P=w;t=r})(),t}};