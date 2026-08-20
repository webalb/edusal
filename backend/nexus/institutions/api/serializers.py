from rest_framework import serializers
from django.contrib.auth import get_user_model
from nexus.institutions.models import (
    Institution,
    InstitutionStatus,
    AcademicDivision,
    Department,
    AcademicProgram,
    AcademicSession,
    InstitutionalDocument,
    InstitutionalDocumentChunk,
    InstitutionStaff,
    StaffAssignment,
    StudentProfile,
    Pathway,
    PathwayMilestone,
    StudentMilestoneSubmission,
    SubmissionStatus,
    DiagnosticAssessment,
    DiagnosticQuestion,
    StudentAssessmentSession,
    AICoachConversation,
    AICoachMessage,
    CounsellingSession,
    CounsellingCaseNote,
    CompanyBankDetail,
    PricingPlan,
    InstitutionInvoice,
    InvoiceStatus,
    LearningResource,
    LearningResourceType,
)

User = get_user_model()


class AcademicProgramSerializer(serializers.ModelSerializer):
    award_level_display = serializers.CharField(source="get_award_level_display", read_only=True)
    department_name = serializers.CharField(source="department.name", read_only=True)
    siwes_pattern_display = serializers.CharField(source="get_siwes_pattern_display", read_only=True)
    siwes_academic_impact_display = serializers.CharField(source="get_siwes_academic_impact_display", read_only=True)

    class Meta:
        model = AcademicProgram
        fields = [
            "id",
            "institution",
            "department",
            "department_name",
            "name",
            "program_code",
            "award_level",
            "award_level_display",
            "duration_years",
            "siwes_duration_months",
            "siwes_pattern",
            "siwes_pattern_display",
            "siwes_academic_impact",
            "siwes_academic_impact_display",
            "siwes_target_levels",
            "is_active",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]


class DepartmentSerializer(serializers.ModelSerializer):
    division_name = serializers.CharField(source="division.name", read_only=True)
    institution_name = serializers.CharField(source="institution.name", read_only=True)
    programs_count = serializers.IntegerField(source="programs.count", read_only=True)
    programs = AcademicProgramSerializer(many=True, read_only=True)

    class Meta:
        model = Department
        fields = [
            "id",
            "institution",
            "institution_name",
            "division",
            "division_name",
            "name",
            "code",
            "hod_name",
            "hod_email",
            "siwes_eligible",
            "is_active",
            "programs_count",
            "programs",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]


class AcademicDivisionSerializer(serializers.ModelSerializer):
    institution_name = serializers.CharField(source="institution.name", read_only=True)
    division_type_display = serializers.CharField(source="get_division_type_display", read_only=True)
    departments_count = serializers.IntegerField(source="departments.count", read_only=True)
    departments = DepartmentSerializer(many=True, read_only=True)

    class Meta:
        model = AcademicDivision
        fields = [
            "id",
            "institution",
            "institution_name",
            "name",
            "code",
            "division_type",
            "division_type_display",
            "dean_name",
            "dean_email",
            "is_active",
            "departments_count",
            "departments",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]


class AcademicSessionSerializer(serializers.ModelSerializer):
    current_semester_display = serializers.CharField(source="get_current_semester_display", read_only=True)

    class Meta:
        model = AcademicSession
        fields = [
            "id",
            "institution",
            "session_label",
            "start_date",
            "end_date",
            "first_semester_start_date",
            "first_semester_end_date",
            "second_semester_start_date",
            "second_semester_end_date",
            "current_semester",
            "current_semester_display",
            "is_current",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]


class InstitutionalDocumentChunkSerializer(serializers.ModelSerializer):
    class Meta:
        model = InstitutionalDocumentChunk
        fields = [
            "id",
            "document",
            "chunk_index",
            "page_number",
            "section_reference",
            "content",
            "created_at",
        ]
        read_only_fields = ["id", "created_at"]


class InstitutionalDocumentSerializer(serializers.ModelSerializer):
    doc_type_display = serializers.CharField(source="get_doc_type_display", read_only=True)
    embedding_status_display = serializers.CharField(source="get_embedding_status_display", read_only=True)
    division_name = serializers.CharField(source="division.name", read_only=True)
    department_name = serializers.CharField(source="department.name", read_only=True)
    session_label = serializers.CharField(source="session.session_label", read_only=True)
    file_url = serializers.SerializerMethodField()
    chunks = InstitutionalDocumentChunkSerializer(many=True, read_only=True)

    class Meta:
        model = InstitutionalDocument
        fields = [
            "id",
            "institution",
            "division",
            "division_name",
            "department",
            "department_name",
            "session",
            "session_label",
            "title",
            "doc_type",
            "doc_type_display",
            "file",
            "file_url",
            "file_path",
            "content_hash",
            "chunk_count",
            "embedding_status",
            "embedding_status_display",
            "raw_text",
            "chunks",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "chunk_count", "embedding_status", "content_hash", "created_at", "updated_at"]

    def get_file_url(self, obj):
        if obj.file:
            return obj.file.url
        return None


class DocumentUploadSerializer(serializers.Serializer):
    institution = serializers.UUIDField(required=True)
    division = serializers.UUIDField(required=False, allow_null=True)
    department = serializers.UUIDField(required=False, allow_null=True)
    session = serializers.UUIDField(required=False, allow_null=True)
    title = serializers.CharField(required=True, max_length=255)
    doc_type = serializers.CharField(required=True, max_length=30)
    file = serializers.FileField(required=False, allow_null=True)
    raw_text = serializers.CharField(required=False, allow_blank=True)


class LearningResourceSerializer(serializers.ModelSerializer):
    resource_type_display = serializers.CharField(source="get_resource_type_display", read_only=True)
    division_name = serializers.CharField(source="division.name", read_only=True)
    department_name = serializers.CharField(source="department.name", read_only=True)
    session_label = serializers.CharField(source="session.session_label", read_only=True)
    file_url = serializers.SerializerMethodField()
    youtube_video_id = serializers.SerializerMethodField()
    youtube_embed_url = serializers.SerializerMethodField()

    class Meta:
        model = LearningResource
        fields = [
            "id",
            "institution",
            "division",
            "division_name",
            "department",
            "department_name",
            "session",
            "session_label",
            "title",
            "description",
            "resource_type",
            "resource_type_display",
            "youtube_url",
            "youtube_video_id",
            "youtube_embed_url",
            "file",
            "file_url",
            "file_name",
            "file_size",
            "is_published",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]

    def get_file_url(self, obj):
        if obj.file:
            return obj.file.url
        return None

    def get_youtube_video_id(self, obj):
        return obj.youtube_video_id

    def get_youtube_embed_url(self, obj):
        if obj.youtube_video_id:
            return f"https://www.youtube.com/embed/{obj.youtube_video_id}"
        return None


class LearningResourceUploadSerializer(serializers.Serializer):
    institution = serializers.UUIDField(required=True)
    division = serializers.UUIDField(required=False, allow_null=True)
    department = serializers.UUIDField(required=False, allow_null=True)
    session = serializers.UUIDField(required=False, allow_null=True)
    title = serializers.CharField(required=True, max_length=255)
    description = serializers.CharField(required=False, allow_blank=True)
    resource_type = serializers.ChoiceField(
        required=True,
        choices=LearningResourceType.choices,
    )
    youtube_url = serializers.URLField(required=False, allow_blank=True, max_length=500)
    file = serializers.FileField(required=False, allow_null=True)


class AIAdvisorQuerySerializer(serializers.Serializer):
    query = serializers.CharField(required=True, max_length=1000)
    division = serializers.UUIDField(required=False, allow_null=True)
    department = serializers.UUIDField(required=False, allow_null=True)
    session = serializers.UUIDField(required=False, allow_null=True)
    doc_type = serializers.CharField(required=False, allow_blank=True)
    top_k = serializers.IntegerField(required=False, default=5, min_value=1, max_value=20)



class InstitutionListSerializer(serializers.ModelSerializer):
    institution_type_display = serializers.CharField(source="get_institution_type_display", read_only=True)
    regulator_display = serializers.CharField(source="get_regulator_display", read_only=True)
    divisions_count = serializers.IntegerField(source="divisions.count", read_only=True)
    departments_count = serializers.IntegerField(source="departments.count", read_only=True)
    programs_count = serializers.IntegerField(source="programs.count", read_only=True)
    documents_count = serializers.IntegerField(source="documents.count", read_only=True)

    class Meta:
        model = Institution
        fields = [
            "id",
            "name",
            "short_name",
            "slug",
            "institution_type",
            "institution_type_display",
            "ownership",
            "regulator",
            "regulator_display",
            "tier_two_term",
            "state",
            "is_founding_partner",
            "status",
            "divisions_count",
            "departments_count",
            "programs_count",
            "documents_count",
            "created_at",
        ]
        read_only_fields = ["id", "created_at"]


class InstitutionDetailSerializer(serializers.ModelSerializer):
    institution_type_display = serializers.CharField(source="get_institution_type_display", read_only=True)
    regulator_display = serializers.CharField(source="get_regulator_display", read_only=True)
    divisions = AcademicDivisionSerializer(many=True, read_only=True)
    sessions = AcademicSessionSerializer(many=True, read_only=True)
    current_session = serializers.SerializerMethodField()

    class Meta:
        model = Institution
        fields = [
            "id",
            "name",
            "short_name",
            "slug",
            "institution_type",
            "institution_type_display",
            "ownership",
            "regulator",
            "regulator_display",
            "tier_two_term",
            "domain_whitelist",
            "address",
            "state",
            "is_founding_partner",
            "status",
            "divisions",
            "sessions",
            "current_session",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]

    def get_current_session(self, obj):
        curr = obj.sessions.filter(is_current=True).first()
        if curr:
            return AcademicSessionSerializer(curr).data
        return None


class DocumentSearchQuerySerializer(serializers.Serializer):
    query = serializers.CharField(required=True, max_length=500)
    top_k = serializers.IntegerField(required=False, default=5, min_value=1, max_value=20)
    doc_type = serializers.CharField(required=False, allow_blank=True)


class InstitutionStaffSerializer(serializers.ModelSerializer):
    user_email = serializers.CharField(source="user.email", read_only=True)
    user_name = serializers.CharField(source="user.name", read_only=True)
    role_display = serializers.CharField(source="get_role_display", read_only=True)
    institution_name = serializers.CharField(source="institution.name", read_only=True)
    institution_short_name = serializers.CharField(source="institution.short_name", read_only=True)
    institution_status = serializers.CharField(source="institution.status", read_only=True)
    division_name = serializers.CharField(source="division.name", read_only=True)
    department_name = serializers.CharField(source="department.name", read_only=True)

    class Meta:
        model = InstitutionStaff
        fields = [
            "id",
            "user",
            "user_email",
            "user_name",
            "institution",
            "institution_name",
            "institution_short_name",
            "institution_status",
            "division",
            "division_name",
            "department",
            "department_name",
            "role",
            "role_display",
            "title",
            "is_active",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]


class StaffAssignmentSerializer(serializers.ModelSerializer):
    user_email = serializers.CharField(source="user.email", read_only=True)
    user_name = serializers.CharField(source="user.name", read_only=True)
    role_at_unit_display = serializers.CharField(source="get_role_at_unit_display", read_only=True)
    institution_name = serializers.CharField(source="institution.name", read_only=True)
    institution_short_name = serializers.CharField(source="institution.short_name", read_only=True)
    institution_status = serializers.CharField(source="institution.status", read_only=True)
    division_name = serializers.CharField(source="division.name", read_only=True)
    department_name = serializers.CharField(source="department.name", read_only=True)

    class Meta:
        model = StaffAssignment
        fields = [
            "id",
            "user",
            "user_email",
            "user_name",
            "institution",
            "institution_name",
            "institution_short_name",
            "institution_status",
            "division",
            "division_name",
            "department",
            "department_name",
            "role_at_unit",
            "role_at_unit_display",
            "official_title",
            "assigned_years_of_study",
            "can_evaluate_milestones",
            "can_manage_waivers",
            "max_caseload",
            "is_primary",
            "is_active",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]


class StudentProfileSerializer(serializers.ModelSerializer):
    user_email = serializers.CharField(source="user.email", read_only=True)
    user_name = serializers.CharField(source="user.name", read_only=True)
    institution_name = serializers.CharField(source="institution.name", read_only=True)
    institution_short_name = serializers.CharField(source="institution.short_name", read_only=True)
    program_name = serializers.CharField(source="program.name", read_only=True)
    program_code = serializers.CharField(source="program.program_code", read_only=True)
    program_duration_years = serializers.IntegerField(source="program.duration_years", read_only=True)
    award_level_display = serializers.CharField(source="program.get_award_level_display", read_only=True)
    department_id = serializers.UUIDField(source="program.department.id", read_only=True)
    department_name = serializers.CharField(source="program.department.name", read_only=True)
    division_id = serializers.UUIDField(source="program.department.division.id", read_only=True)
    division_name = serializers.CharField(source="program.department.division.name", read_only=True)
    entry_session_label = serializers.CharField(source="entry_session.session_label", read_only=True)
    entry_mode_display = serializers.CharField(source="get_entry_mode_display", read_only=True)
    academic_standing_display = serializers.CharField(source="get_academic_standing_display", read_only=True)
    siwes_clearance_status_display = serializers.CharField(source="get_siwes_clearance_status_display", read_only=True)
    level_code = serializers.CharField(source="get_level_code", read_only=True)
    level_display = serializers.CharField(source="get_level_display", read_only=True)
    is_final_year = serializers.BooleanField(read_only=True)
    is_siwes_year = serializers.BooleanField(read_only=True)
    active_pathway_title = serializers.CharField(source="active_pathway.title", read_only=True, default=None)
    active_pathway_career_role = serializers.CharField(source="active_pathway.career_role", read_only=True, default=None)

    class Meta:
        model = StudentProfile
        fields = [
            "id",
            "user",
            "user_email",
            "user_name",
            "institution",
            "institution_name",
            "institution_short_name",
            "program",
            "program_name",
            "program_code",
            "program_duration_years",
            "award_level_display",
            "department_id",
            "department_name",
            "division_id",
            "division_name",
            "matric_number",
            "jamb_reg_number",
            "entry_session",
            "entry_session_label",
            "entry_mode",
            "entry_mode_display",
            "year_of_study",
            "level_code",
            "level_display",
            "is_final_year",
            "is_siwes_year",
            "is_spillover",
            "active_pathway",
            "active_pathway_title",
            "active_pathway_career_role",
            "employability_score",
            "verified_points_total",
            "milestones_completed_count",
            "cgpa",
            "academic_standing",
            "academic_standing_display",
            "siwes_clearance_status",
            "siwes_clearance_status_display",
            "phone_number",
            "state_of_origin",
            "gender",
            "bio",
            "portfolio_url",
            "linkedin_url",
            "is_verified_student",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "level_code",
            "level_display",
            "is_final_year",
            "is_siwes_year",
            "employability_score",
            "verified_points_total",
            "milestones_completed_count",
            "created_at",
            "updated_at",
        ]



class StudentProfileCreateSerializer(serializers.Serializer):
    email = serializers.EmailField(required=True)
    name = serializers.CharField(required=True, max_length=150)
    password = serializers.CharField(required=False, default="1234!@#$", write_only=True)
    institution = serializers.UUIDField(required=True)
    program = serializers.UUIDField(required=True)
    matric_number = serializers.CharField(required=True, max_length=50)
    jamb_reg_number = serializers.CharField(required=False, allow_blank=True, default="")
    entry_session = serializers.UUIDField(required=True)
    entry_mode = serializers.CharField(required=False, default="UTME")
    year_of_study = serializers.IntegerField(required=False, default=1, min_value=1, max_value=6)
    cgpa = serializers.DecimalField(required=False, allow_null=True, max_digits=4, decimal_places=2)
    phone_number = serializers.CharField(required=False, allow_blank=True, default="")
    state_of_origin = serializers.CharField(required=False, allow_blank=True, default="")
    gender = serializers.CharField(required=False, allow_blank=True, default="")
    portfolio_url = serializers.URLField(required=False, allow_blank=True, default="")


class AuthLoginSerializer(serializers.Serializer):
    email = serializers.EmailField(required=True)
    password = serializers.CharField(required=True, write_only=True)


class ForgotPasswordSerializer(serializers.Serializer):
    email = serializers.EmailField(required=True)


class ResetPasswordSerializer(serializers.Serializer):
    email = serializers.EmailField(required=True)
    code = serializers.CharField(required=True, write_only=True)
    new_password = serializers.CharField(
        required=True,
        write_only=True,
        min_length=8,
        error_messages={"min_length": "Password must be at least 8 characters."},
    )


class AuthUserSerializer(serializers.Serializer):
    id = serializers.IntegerField()
    email = serializers.EmailField()
    name = serializers.CharField()
    is_superuser = serializers.BooleanField()
    is_staff = serializers.BooleanField()
    staff_profile = serializers.SerializerMethodField()
    staff_assignments = serializers.SerializerMethodField()
    student_profile = serializers.SerializerMethodField()

    def get_staff_profile(self, obj):
        staff = obj.institution_staff_profiles.filter(is_active=True).select_related("institution", "division", "department").first()
        if staff:
            return InstitutionStaffSerializer(staff).data
        return None

    def get_staff_assignments(self, obj):
        assignments = obj.staff_assignments.filter(is_active=True).select_related("institution", "division", "department")
        return StaffAssignmentSerializer(assignments, many=True).data

    def get_student_profile(self, obj):
        if hasattr(obj, "student_profile") and obj.student_profile:
            return StudentProfileSerializer(obj.student_profile).data
        return None


class PathwayMilestoneSerializer(serializers.ModelSerializer):
    milestone_type_display = serializers.CharField(source="get_milestone_type_display", read_only=True)
    verification_method_display = serializers.CharField(source="get_verification_method_display", read_only=True)
    required_evidence_type_display = serializers.CharField(source="get_required_evidence_type_display", read_only=True)

    class Meta:
        model = PathwayMilestone
        fields = [
            "id",
            "pathway",
            "order_index",
            "year_of_study",
            "target_level_code",
            "target_semester",
            "title",
            "description",
            "milestone_type",
            "milestone_type_display",
            "points",
            "is_mandatory",
            "verification_method",
            "verification_method_display",
            "required_evidence_type",
            "required_evidence_type_display",
            "competency_tags",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]


class PathwayMilestoneCreateUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = PathwayMilestone
        fields = [
            "id",
            "pathway",
            "order_index",
            "year_of_study",
            "target_level_code",
            "target_semester",
            "title",
            "description",
            "milestone_type",
            "points",
            "is_mandatory",
            "verification_method",
            "required_evidence_type",
            "competency_tags",
        ]
        read_only_fields = ["id"]


class PathwayListSerializer(serializers.ModelSerializer):
    program_name = serializers.CharField(source="program.name", read_only=True)
    program_code = serializers.CharField(source="program.program_code", read_only=True)
    award_level = serializers.CharField(source="program.award_level", read_only=True)
    award_level_display = serializers.CharField(source="program.get_award_level_display", read_only=True)
    duration_years = serializers.IntegerField(source="program.duration_years", read_only=True)
    department_id = serializers.UUIDField(source="program.department.id", read_only=True)
    department_name = serializers.CharField(source="program.department.name", read_only=True)
    division_name = serializers.CharField(source="program.department.division.name", read_only=True)
    created_by_name = serializers.CharField(source="created_by.name", read_only=True)
    cloned_from_title = serializers.CharField(source="cloned_from.title", read_only=True)

    class Meta:
        model = Pathway
        fields = [
            "id",
            "institution",
            "program",
            "program_name",
            "program_code",
            "award_level",
            "award_level_display",
            "duration_years",
            "department_id",
            "department_name",
            "division_name",
            "title",
            "career_role",
            "industry_sector",
            "description",
            "target_cgpa_recommendation",
            "total_milestones_count",
            "total_points",
            "is_active",
            "is_template",
            "template_visibility",
            "cloned_from",
            "cloned_from_title",
            "version",
            "created_by",
            "created_by_name",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "total_milestones_count", "total_points", "created_at", "updated_at"]


class PathwayDetailSerializer(PathwayListSerializer):
    milestones = PathwayMilestoneSerializer(many=True, read_only=True)

    class Meta(PathwayListSerializer.Meta):
        fields = PathwayListSerializer.Meta.fields + ["milestones"]


class PathwayCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Pathway
        fields = [
            "id",
            "institution",
            "program",
            "title",
            "career_role",
            "industry_sector",
            "description",
            "target_cgpa_recommendation",
            "is_active",
            "is_template",
            "template_visibility",
        ]
        read_only_fields = ["id"]


class PathwayClonePayloadSerializer(serializers.Serializer):
    target_program = serializers.UUIDField(required=True)
    custom_title = serializers.CharField(required=False, allow_blank=True, max_length=200)
    custom_description = serializers.CharField(required=False, allow_blank=True)


class PathwayPublishTemplatePayloadSerializer(serializers.Serializer):
    visibility = serializers.CharField(required=False, default="INSTITUTION")


class StudentMilestoneSubmissionSerializer(serializers.ModelSerializer):
    milestone_title = serializers.CharField(source="milestone.title", read_only=True)
    milestone_points = serializers.IntegerField(source="milestone.points", read_only=True)
    milestone_type = serializers.CharField(source="milestone.milestone_type", read_only=True)
    milestone_type_display = serializers.CharField(source="milestone.get_milestone_type_display", read_only=True)
    year_of_study = serializers.IntegerField(source="milestone.year_of_study", read_only=True)
    target_level_code = serializers.CharField(source="milestone.target_level_code", read_only=True)
    target_semester = serializers.CharField(source="milestone.target_semester", read_only=True)
    required_evidence_type = serializers.CharField(source="milestone.required_evidence_type", read_only=True)
    verification_method = serializers.CharField(source="milestone.verification_method", read_only=True)
    status_display = serializers.CharField(source="get_status_display", read_only=True)
    reviewed_by_name = serializers.CharField(source="reviewed_by.name", read_only=True, default=None)
    student_matric = serializers.CharField(source="student.matric_number", read_only=True)
    student_name = serializers.CharField(source="student.user.name", read_only=True)

    class Meta:
        model = StudentMilestoneSubmission
        fields = [
            "id",
            "student",
            "student_matric",
            "student_name",
            "milestone",
            "milestone_title",
            "milestone_points",
            "milestone_type",
            "milestone_type_display",
            "year_of_study",
            "target_level_code",
            "target_semester",
            "required_evidence_type",
            "verification_method",
            "status",
            "status_display",
            "evidence_url",
            "evidence_file",
            "submission_notes",
            "points_awarded",
            "reviewed_by",
            "reviewed_by_name",
            "reviewed_at",
            "review_feedback",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "status",
            "points_awarded",
            "reviewed_by",
            "reviewed_at",
            "created_at",
            "updated_at",
        ]


class StudentSubmissionCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = StudentMilestoneSubmission
        fields = [
            "milestone",
            "evidence_url",
            "evidence_file",
            "submission_notes",
        ]


class StudentSubmissionReviewSerializer(serializers.Serializer):
    status = serializers.ChoiceField(
        choices=[
            ("VERIFIED", "Verified & Points Awarded"),
            ("CHANGES_REQUESTED", "Changes / Re-submission Requested"),
            ("REJECTED", "Rejected / Incomplete"),
        ]
    )
    points_awarded = serializers.IntegerField(required=False, min_value=0)
    review_feedback = serializers.CharField(required=False, allow_blank=True, default="")


class StudentCredentialGenerationSerializer(serializers.Serializer):
    custom_password = serializers.CharField(required=False, allow_blank=True, max_length=100)
    login_url = serializers.CharField(required=False, allow_blank=True, default="http://localhost:5173")


class StudentEnrollPathwaySerializer(serializers.Serializer):
    pathway = serializers.UUIDField(required=True)


class StudentDashboardDataSerializer(serializers.Serializer):
    profile = StudentProfileSerializer()
    active_pathway = PathwayDetailSerializer(allow_null=True)
    submissions = StudentMilestoneSubmissionSerializer(many=True)
    employability_summary = serializers.DictField()


# =============================================================================
# Diagnostic Assessments Serializers
# =============================================================================

class DiagnosticQuestionSerializer(serializers.ModelSerializer):
    class Meta:
        model = DiagnosticQuestion
        fields = [
            "id",
            "order_index",
            "prompt",
            "dimension",
            "is_reverse_scored",
            "question_type",
            "options",
            "explanation",
        ]


class DiagnosticAssessmentListSerializer(serializers.ModelSerializer):
    assessment_type_display = serializers.CharField(source="get_assessment_type_display", read_only=True)
    questions_count = serializers.IntegerField(source="questions.count", read_only=True)

    class Meta:
        model = DiagnosticAssessment
        fields = [
            "id",
            "institution",
            "assessment_type",
            "assessment_type_display",
            "title",
            "slug",
            "description",
            "instructions",
            "estimated_minutes",
            "total_questions",
            "questions_count",
            "is_active",
            "created_at",
        ]


class DiagnosticAssessmentDetailSerializer(serializers.ModelSerializer):
    assessment_type_display = serializers.CharField(source="get_assessment_type_display", read_only=True)
    questions = DiagnosticQuestionSerializer(many=True, read_only=True)

    class Meta:
        model = DiagnosticAssessment
        fields = [
            "id",
            "institution",
            "assessment_type",
            "assessment_type_display",
            "title",
            "slug",
            "description",
            "instructions",
            "estimated_minutes",
            "total_questions",
            "questions",
            "is_active",
            "created_at",
        ]


class StudentAssessmentSubmitSerializer(serializers.Serializer):
    assessment_id = serializers.UUIDField(required=True)
    raw_responses = serializers.DictField(required=True)


class StudentAssessmentSessionSerializer(serializers.ModelSerializer):
    assessment_title = serializers.CharField(source="assessment.title", read_only=True)
    assessment_type = serializers.CharField(source="assessment.assessment_type", read_only=True)
    assessment_type_display = serializers.CharField(source="assessment.get_assessment_type_display", read_only=True)
    student_matric = serializers.CharField(source="student.matric_number", read_only=True)
    student_name = serializers.CharField(source="student.user.name", read_only=True)

    class Meta:
        model = StudentAssessmentSession
        fields = [
            "id",
            "student",
            "student_matric",
            "student_name",
            "assessment",
            "assessment_title",
            "assessment_type",
            "assessment_type_display",
            "status",
            "raw_responses",
            "dimension_scores",
            "summary_code",
            "percentile_rank",
            "summary_report",
            "career_recommendations",
            "started_at",
            "completed_at",
        ]


# =============================================================================
# 24/7 AI Career Coach Serializers
# =============================================================================

class AICoachMessageSerializer(serializers.ModelSerializer):
    class Meta:
        model = AICoachMessage
        fields = [
            "id",
            "conversation",
            "role",
            "content",
            "citations",
            "telemetry",
            "created_at",
        ]


class AICoachConversationSerializer(serializers.ModelSerializer):
    messages = AICoachMessageSerializer(many=True, read_only=True)
    messages_count = serializers.IntegerField(source="messages.count", read_only=True)
    last_message = serializers.SerializerMethodField()

    class Meta:
        model = AICoachConversation
        fields = [
            "id",
            "student",
            "title",
            "is_active",
            "case_summary",
            "messages_count",
            "last_message",
            "messages",
            "created_at",
            "updated_at",
        ]

    def get_last_message(self, obj):
        last = obj.messages.order_by("-created_at").first()
        if last:
            return AICoachMessageSerializer(last).data
        return None


class AICoachChatPayloadSerializer(serializers.Serializer):
    message = serializers.CharField(required=True, max_length=2000)


# =============================================================================
# Counselling Sessions & Case Notes Serializers
# =============================================================================

class CounsellingCaseNoteSerializer(serializers.ModelSerializer):
    author_name = serializers.CharField(source="author.user.name", read_only=True)
    author_title = serializers.CharField(source="author.title", read_only=True)
    student_matric = serializers.CharField(source="student.matric_number", read_only=True)

    class Meta:
        model = CounsellingCaseNote
        fields = [
            "id",
            "session",
            "student",
            "student_matric",
            "author",
            "author_name",
            "author_title",
            "summary",
            "action_items",
            "is_confidential",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "author", "created_at", "updated_at"]


class CounsellingSessionSerializer(serializers.ModelSerializer):
    topic_display = serializers.CharField(source="get_topic_display", read_only=True)
    status_display = serializers.CharField(source="get_status_display", read_only=True)
    meeting_mode_display = serializers.CharField(source="get_meeting_mode_display", read_only=True)
    student_matric = serializers.CharField(source="student.matric_number", read_only=True)
    student_name = serializers.CharField(source="student.user.name", read_only=True)
    student_program = serializers.CharField(source="student.program.name", read_only=True)
    student_level = serializers.CharField(source="student.get_level_display", read_only=True)
    counsellor_name = serializers.CharField(source="counsellor.user.name", read_only=True, default=None)
    counsellor_title = serializers.CharField(source="counsellor.title", read_only=True, default=None)
    case_notes = CounsellingCaseNoteSerializer(many=True, read_only=True)

    class Meta:
        model = CounsellingSession
        fields = [
            "id",
            "student",
            "student_matric",
            "student_name",
            "student_program",
            "student_level",
            "counsellor",
            "counsellor_name",
            "counsellor_title",
            "topic",
            "topic_display",
            "student_notes",
            "status",
            "status_display",
            "preferred_date",
            "preferred_time_slot",
            "scheduled_datetime",
            "meeting_mode",
            "meeting_mode_display",
            "meeting_location",
            "case_notes",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "status", "created_at", "updated_at"]


class CounsellingSessionCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = CounsellingSession
        fields = [
            "counsellor",
            "topic",
            "student_notes",
            "preferred_date",
            "preferred_time_slot",
            "meeting_mode",
            "meeting_location",
        ]


class CounsellingSessionConfirmSerializer(serializers.Serializer):
    status = serializers.ChoiceField(
        choices=["CONFIRMED", "COMPLETED", "RESCHEDULED", "CANCELLED"],
        default="CONFIRMED",
    )
    scheduled_datetime = serializers.DateTimeField(required=False, allow_null=True)
    meeting_location = serializers.CharField(required=False, allow_blank=True)


class StudentDossierSerializer(serializers.Serializer):
    """Complete 360° student dossier presented to departmental counsellors and HODs."""

    profile = StudentProfileSerializer()
    active_pathway = PathwayDetailSerializer(allow_null=True)
    submissions = StudentMilestoneSubmissionSerializer(many=True)
    assessments = StudentAssessmentSessionSerializer(many=True)
    counselling_sessions = CounsellingSessionSerializer(many=True)
    case_notes = CounsellingCaseNoteSerializer(many=True)
    ai_coach_summary = serializers.CharField(allow_blank=True)
    employability_summary = serializers.DictField()


class CompanyBankDetailSerializer(serializers.ModelSerializer):
    class Meta:
        model = CompanyBankDetail
        fields = [
            "id",
            "account_name",
            "bank_name",
            "account_number",
            "sort_code_or_swift",
            "currency",
            "payment_instructions",
            "support_email",
            "support_phone",
            "is_active",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]


class PricingPlanSerializer(serializers.ModelSerializer):
    class Meta:
        model = PricingPlan
        fields = [
            "id",
            "code",
            "name",
            "target_institution_type",
            "description",
            "base_fee",
            "setup_onboarding_fee",
            "per_student_fee",
            "max_students",
            "features",
            "currency",
            "billing_cycle",
            "is_active",
        ]
        read_only_fields = ["id"]


class InstitutionInvoiceSerializer(serializers.ModelSerializer):
    institution_name = serializers.CharField(source="institution.name", read_only=True)
    institution_short_name = serializers.CharField(source="institution.short_name", read_only=True)
    institution_status = serializers.CharField(source="institution.status", read_only=True)
    status_display = serializers.CharField(source="get_status_display", read_only=True)
    payment_receipt_url = serializers.SerializerMethodField()
    confirmed_by_name = serializers.SerializerMethodField()
    confirmed_by_email = serializers.SerializerMethodField()

    class Meta:
        model = InstitutionInvoice
        fields = [
            "id",
            "invoice_number",
            "institution",
            "institution_name",
            "institution_short_name",
            "institution_status",
            "plan",
            "plan_name",
            "issued_to_name",
            "issued_to_email",
            "subtotal_amount",
            "setup_fee",
            "vat_rate",
            "vat_amount",
            "discount_amount",
            "total_amount",
            "currency",
            "status",
            "status_display",
            "bank_details_snapshot",
            "items_breakdown",
            "due_date",
            "payment_reference",
            "payment_receipt_url",
            "payer_bank_name",
            "payer_account_name",
            "payment_date",
            "payment_notes",
            "payment_submitted_at",
            "confirmed_at",
            "confirmed_by_name",
            "confirmed_by_email",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "invoice_number",
            "institution",
            "plan",
            "plan_name",
            "subtotal_amount",
            "setup_fee",
            "vat_rate",
            "vat_amount",
            "discount_amount",
            "total_amount",
            "currency",
            "status",
            "bank_details_snapshot",
            "items_breakdown",
            "due_date",
            "confirmed_at",
            "created_at",
            "updated_at",
        ]

    def get_payment_receipt_url(self, obj):
        if obj.payment_receipt_file:
            request = self.context.get("request")
            if request:
                return request.build_absolute_uri(obj.payment_receipt_file.url)
            return obj.payment_receipt_file.url
        return None

    def get_confirmed_by_name(self, obj):
        return obj.confirmed_by.get_full_name() or obj.confirmed_by.email if obj.confirmed_by else None

    def get_confirmed_by_email(self, obj):
        return obj.confirmed_by.email if obj.confirmed_by else None


class InvoiceSubmitPaymentSerializer(serializers.Serializer):
    payment_reference = serializers.CharField(required=True, max_length=100)
    payer_bank_name = serializers.CharField(required=False, allow_blank=True, default="")
    payer_account_name = serializers.CharField(required=False, allow_blank=True, default="")
    payment_date = serializers.DateField(required=False, allow_null=True)
    payment_receipt_file = serializers.FileField(required=False, allow_null=True)
    payment_notes = serializers.CharField(required=False, allow_blank=True, default="")


class AdminUserSerializer(serializers.ModelSerializer):
    """Platform admin view of a user with their institution role(s)."""

    staff_profile = serializers.SerializerMethodField()
    student_profile = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            "id",
            "email",
            "name",
            "is_active",
            "is_staff",
            "is_superuser",
            "date_joined",
            "last_login",
            "staff_profile",
            "student_profile",
        ]

    def get_staff_profile(self, obj):
        staff = (
            obj.institution_staff_profiles.filter(is_active=True)
            .select_related("institution")
            .first()
        )
        if not staff:
            return None
        return {
            "institution": str(staff.institution_id) if staff.institution_id else None,
            "institution_name": staff.institution.name if staff.institution_id else None,
            "role": staff.role,
            "role_display": staff.get_role_display(),
            "title": staff.title,
        }

    def get_student_profile(self, obj):
        sp = getattr(obj, "student_profile", None)
        if not sp:
            return None
        return {
            "institution": str(sp.institution_id) if sp.institution_id else None,
            "institution_name": sp.institution.name if sp.institution_id else None,
            "program": sp.program.name if sp.program_id else None,
            "matric_number": sp.matric_number,
            "year_of_study": sp.year_of_study,
        }


class InstitutionRegistrationSerializer(serializers.Serializer):
    # Institution Info
    legal_name = serializers.CharField(max_length=255)
    short_name = serializers.CharField(max_length=60)
    institution_type = serializers.CharField(max_length=30, default="UNIVERSITY")
    ownership = serializers.CharField(max_length=20, default="FEDERAL")
    regulator = serializers.CharField(max_length=20, default="NUC")
    state = serializers.CharField(max_length=50, default="Niger")
    city = serializers.CharField(max_length=100, required=False, allow_blank=True, default="")
    address = serializers.CharField(max_length=255, required=False, allow_blank=True, default="")
    website = serializers.CharField(max_length=255, required=False, allow_blank=True, default="")

    # Admin User Info
    contact_name = serializers.CharField(max_length=255)
    contact_email = serializers.EmailField()
    contact_phone = serializers.CharField(max_length=50, required=False, allow_blank=True, default="")
    designation = serializers.CharField(max_length=100, required=False, allow_blank=True, default="Director of Career Services")
    password = serializers.CharField(write_only=True, min_length=6)

    # Scoping & Tier
    tier = serializers.CharField(max_length=50, default="standard")
    faculties = serializers.ListField(child=serializers.CharField(), required=False, default=list)
    counsellor_seats = serializers.IntegerField(required=False, default=10)
    modules = serializers.ListField(child=serializers.CharField(), required=False, default=list)
    add_ons = serializers.ListField(child=serializers.CharField(), required=False, default=list)

    # Compliance
    dpo_name = serializers.CharField(max_length=255, required=False, allow_blank=True, default="")
    dpo_email = serializers.EmailField(required=False, allow_blank=True, default="")





