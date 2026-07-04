% policies/pipeline_policy.pl
validate_pipeline(Stage, Inputs) :-
    member(Stage, [build, test, sign, deploy]),
    nonvar(Inputs).
