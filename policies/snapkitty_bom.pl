:- module(snapkitty_bom, [version/1, msys2_base/3, mingw_w64/2, runtime_package/2, bom_json/1]).

:- use_module(library(http/json)).

version("1.0.0-meta").
msys2_base(commit("a1b2c3d4"), date("20241001"), sha256("e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855")).
mingw_w64(version("12.0.0"), triplet("x86_64-w64-mingw32")).
runtime_package(git, version("2.45.0")).
runtime_package(openssh, version("9.7p1")).
runtime_package(jq, version("1.7.1")).
runtime_package(swi_prolog, version("9.2.0")).

bom_json(Out) :-
    version(V),
    msys2_base(commit(_C), date(D), sha256(S)),
    mingw_w64(version(MV), triplet(_MT)),
    runtime_package(git, version(GV)),
    runtime_package(openssh, version(OV)),
    runtime_package(jq, version(JV)),
    runtime_package(swi_prolog, version(PV)),
    Dict = _{
        version: V,
        msys2_base: _{ date: D, sha256: S },
        mingw_w64: _{ version: MV },
        runtime_package: _{
            git: _{ version: GV },
            openssh: _{ version: OV },
            jq: _{ version: JV },
            swi_prolog: _{ version: PV }
        }
    },
    with_output_to(string(Out), json_write(current_output, Dict, [width(0)])).
